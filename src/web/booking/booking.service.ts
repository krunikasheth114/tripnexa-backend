import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { BookingStatus, PaymentStatus, Status } from '../../../generated/prisma';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE BOOKING + STRIPE PAYMENT INTENT
  // ─────────────────────────────────────────────────────────────
  async createBooking(dto: CreateBookingDto, userId: number) {
    // 1. Validate package
    const pkg = await this.prisma.package.findFirst({
      where: { id: dto.packageId, status: Status.ACTIVE, deletedAt: null },
    });
    if (!pkg) throw new NotFoundException('Package not found or inactive');

    // 2b. Return existing PENDING booking instead of creating a new one
    const existingPending = await this.prisma.booking.findFirst({
      where: {
        userId,
        packageId: dto.packageId,
        bookingStatus: BookingStatus.PENDING,
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
      },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (existingPending) {
      this.logger.warn(
        `Resuming existing PENDING booking | bookingNumber=${existingPending.bookingNumber} | userId=${userId}`,
      );

      // If payment previously failed, create a fresh PaymentIntent for retry
      if (existingPending.paymentStatus === PaymentStatus.FAILED) {
        const newIntent = await this.stripeService.createPaymentIntent(
          existingPending.totalAmount,
          existingPending.bookingNumber + '-retry',
          {
            bookingId: String(existingPending.id),
            bookingNumber: existingPending.bookingNumber,
            userId: String(userId),
            packageId: String(dto.packageId),
          },
        );

        await this.prisma.payment.create({
          data: {
            bookingId: existingPending.id,
            transactionId: newIntent.id,
            paymentGateway: 'STRIPE',
            paymentMethod: 'CARD',
            amount: existingPending.totalAmount,
            currency: 'INR',
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        await this.prisma.booking.update({
          where: { id: existingPending.id },
          data: { paymentStatus: PaymentStatus.PENDING },
        });

        this.logger.log(
          `New PaymentIntent for retry | piId=${newIntent.id} | bookingNumber=${existingPending.bookingNumber}`,
        );

        return {
          bookingNumber: existingPending.bookingNumber,
          bookingId: existingPending.id,
          totalAmount: existingPending.totalAmount,
          clientSecret: newIntent.client_secret,
        };
      }

      // Still PENDING — return existing clientSecret from last payment
      const lastPayment = existingPending.payments[0];
      return {
        bookingNumber: existingPending.bookingNumber,
        bookingId: existingPending.id,
        totalAmount: existingPending.totalAmount,
        clientSecret: lastPayment?.transactionId
          ? null // clientSecret cannot be re-fetched from stored ID — Stripe hides it
          : null,
      };
    }

    // 3. Calculate total amount
    const pricePerPerson = pkg.discountPrice ?? pkg.price;
    const stateTransport =
      dto.fromState && dto.fromState !== 'Gujarat' ? 1200 : 0;
    const subtotal = pricePerPerson * dto.totalGuests + stateTransport;
    const gst = Math.round(subtotal * 0.05);
    const serviceFee = 500;
    const totalAmount = subtotal + gst + serviceFee;

    // 4. Generate unique booking number
    const bookingNumber = `TN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    this.logger.log(
      `Creating booking | bookingNumber=${bookingNumber} | userId=${userId} | packageId=${dto.packageId} | amount=₹${totalAmount}`,
    );

    // 5. Create Booking + Guests in a transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          packageId: dto.packageId,
          travelDate: new Date(dto.travelDate),
          totalGuests: dto.totalGuests,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          bookingStatus: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          specialRequest: dto.specialRequest,
          guests: {
            create: dto.guests.map((g) => ({
              firstName:   g.firstName,
              lastName:    g.lastName,
              age:         g.age,
              gender:      g.gender as any,
              phone:       g.phone,
              email:       g.email,
              nationality: g.nationality,
            })),
          },
        },
        include: { guests: true },
      });

      return newBooking;
    });

    // 6. Create Stripe PaymentIntent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      totalAmount,
      bookingNumber,
      {
        bookingId: String(booking.id),
        bookingNumber,
        userId: String(userId),
        packageId: String(dto.packageId),
      },
    );

    // 7. Store Payment row (PENDING)
    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId: paymentIntent.id,
        paymentGateway: 'STRIPE',
        paymentMethod: 'CARD',
        amount: totalAmount,
        currency: 'INR',
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    this.logger.log(
      `PaymentIntent created | piId=${paymentIntent.id} | bookingNumber=${bookingNumber}`,
    );

    return {
      bookingNumber,
      bookingId: booking.id,
      totalAmount,
      clientSecret: paymentIntent.client_secret,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CONFIRM BOOKING (called from webhook: payment_intent.succeeded)
  // ─────────────────────────────────────────────────────────────
  async confirmBooking(
    bookingId: number,
    paymentIntentId: string,
    amountPaid: number,
  ) {
    this.logger.log(
      `Confirming booking | bookingId=${bookingId} | piId=${paymentIntentId} | amountPaid=₹${amountPaid}`,
    );

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      this.logger.error(`Booking not found for confirmation | bookingId=${bookingId}`);
      return;
    }

    // Guard: already confirmed — idempotent
    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      this.logger.warn(
        `Booking already confirmed — skipping | bookingId=${bookingId}`,
      );
      return;
    }

    await this.prisma.$transaction([
      // Update payment row
      this.prisma.payment.updateMany({
        where: { bookingId, transactionId: paymentIntentId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      }),
      // Update booking
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          paidAmount: amountPaid,
          remainingAmount: Math.max(0, booking.totalAmount - amountPaid),
          paymentStatus: PaymentStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
        },
      }),
    ]);

    this.logger.log(
      `Booking CONFIRMED | bookingId=${bookingId} | bookingNumber=${booking.bookingNumber}`,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FAIL BOOKING (called from webhook: payment_intent.payment_failed)
  // ─────────────────────────────────────────────────────────────
  async failBooking(bookingId: number, paymentIntentId: string) {
    this.logger.warn(
      `Payment FAILED | bookingId=${bookingId} | piId=${paymentIntentId}`,
    );

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      this.logger.error(`Booking not found for failure | bookingId=${bookingId}`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { bookingId, transactionId: paymentIntentId },
        data: { paymentStatus: PaymentStatus.FAILED },
      }),
      // Keep bookingStatus PENDING so user can retry payment
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: PaymentStatus.FAILED },
      }),
    ]);

    this.logger.warn(
      `Booking marked FAILED (retryable) | bookingId=${bookingId} | bookingNumber=${booking.bookingNumber}`,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // REFUND BOOKING (called from webhook: charge.refunded)
  // ─────────────────────────────────────────────────────────────
  async refundBooking(bookingId: number) {
    this.logger.warn(`Processing REFUND | bookingId=${bookingId}`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      this.logger.error(`Booking not found for refund | bookingId=${bookingId}`);
      return;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        paidAmount: 0,
        remainingAmount: booking.totalAmount,
      },
    });

    this.logger.log(
      `Booking REFUNDED + CANCELLED | bookingId=${bookingId} | bookingNumber=${booking.bookingNumber}`,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GET BOOKING BY NUMBER (for success/status page)
  // ─────────────────────────────────────────────────────────────
  async getByBookingNumber(bookingNumber: string, userId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: { bookingNumber, userId },
      include: {
        package: {
          select: {
            id: true,
            title: true,
            days: true,
            nights: true,
            destination: { select: { id: true, name: true } },
            gallery: {
              where: { deletedAt: null },
              orderBy: { position: 'asc' },
              take: 1,
            },
          },
        },
        guests: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  // ─────────────────────────────────────────────────────────────
  // GET MY BOOKINGS (user's booking history)
  // ─────────────────────────────────────────────────────────────
  async getMyBookings(userId: number) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        package: {
          select: {
            id: true,
            title: true,
            days: true,
            nights: true,
            destination: { select: { name: true } },
            gallery: {
              where: { deletedAt: null },
              orderBy: { position: 'asc' },
              take: 1,
            },
          },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE HOTEL BOOKING
  // ─────────────────────────────────────────────────────────────
  async createHotelBooking(dto: CreateHotelBookingDto, userId: number) {
    // 1. Validate hotel
    const hotel = await this.prisma.hotel.findFirst({
      where: { id: dto.hotelId, status: Status.ACTIVE, deletedAt: null },
    });
    if (!hotel) throw new NotFoundException('Hotel not found or inactive');
    if (!hotel.perNightPrice)
      throw new BadRequestException('Hotel pricing not configured');

    // 2. Calculate nights
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (nights < 1)
      throw new BadRequestException('Check-out must be after check-in');

    // 3. Calculate total
    const roomCost = hotel.perNightPrice * dto.totalRooms * nights;
    const MEAL_PRICES: Record<string, number> = {
      BREAKFAST: 350,
      LUNCH: 500,
      DINNER: 600,
      HALF_BOARD: 900,
      FULL_BOARD: 1400,
    };
    const mealCostPerPersonPerNight = dto.meals.reduce(
      (sum, m) => sum + (MEAL_PRICES[m] ?? 0),
      0,
    );
    const mealCost = mealCostPerPersonPerNight * dto.totalGuests * nights;
    const gst = Math.round(roomCost * 0.12 + mealCost * 0.05);
    const serviceFee = 299;
    const totalAmount = roomCost + mealCost + gst + serviceFee;

    // 4. Check for existing pending hotel booking
    const existingPending = await this.prisma.booking.findFirst({
      where: {
        userId,
        hotelId: dto.hotelId,
        bookingStatus: BookingStatus.PENDING,
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
      },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (existingPending) {
      this.logger.warn(
        `Resuming existing PENDING hotel booking | bookingNumber=${existingPending.bookingNumber} | userId=${userId}`,
      );

      if (existingPending.paymentStatus === PaymentStatus.FAILED) {
        const newIntent = await this.stripeService.createPaymentIntent(
          existingPending.totalAmount,
          existingPending.bookingNumber + '-retry',
          {
            bookingId: String(existingPending.id),
            bookingNumber: existingPending.bookingNumber,
            userId: String(userId),
            hotelId: String(dto.hotelId),
          },
        );

        await this.prisma.payment.create({
          data: {
            bookingId: existingPending.id,
            transactionId: newIntent.id,
            paymentGateway: 'STRIPE',
            paymentMethod: 'CARD',
            amount: existingPending.totalAmount,
            currency: 'INR',
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        await this.prisma.booking.update({
          where: { id: existingPending.id },
          data: { paymentStatus: PaymentStatus.PENDING },
        });

        return {
          bookingNumber: existingPending.bookingNumber,
          bookingId: existingPending.id,
          totalAmount: existingPending.totalAmount,
          clientSecret: newIntent.client_secret,
        };
      }

      return {
        bookingNumber: existingPending.bookingNumber,
        bookingId: existingPending.id,
        totalAmount: existingPending.totalAmount,
        clientSecret: null,
      };
    }

    // 5. Generate booking number
    const bookingNumber = `TN-H-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    this.logger.log(
      `Creating hotel booking | bookingNumber=${bookingNumber} | userId=${userId} | hotelId=${dto.hotelId} | amount=₹${totalAmount}`,
    );

    // 6. Create booking + guests
    const booking = await this.prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data: {
          bookingNumber,
          bookingType: 'HOTEL',
          userId,
          hotelId: dto.hotelId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalNights: nights,
          totalRooms: dto.totalRooms,
          meals: dto.meals,
          totalGuests: dto.totalGuests,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          bookingStatus: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          specialRequest: dto.specialRequest,
          guests: {
            create: dto.guests.map((g) => ({
              firstName: g.firstName,
              lastName: g.lastName,
              age: g.age,
              gender: g.gender as any,
              phone: g.phone,
              email: g.email,
              nationality: g.nationality,
            })),
          },
        },
        include: { guests: true },
      });
    });

    // 7. Create Stripe PaymentIntent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      totalAmount,
      bookingNumber,
      {
        bookingId: String(booking.id),
        bookingNumber,
        userId: String(userId),
        hotelId: String(dto.hotelId),
      },
    );

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId: paymentIntent.id,
        paymentGateway: 'STRIPE',
        paymentMethod: 'CARD',
        amount: totalAmount,
        currency: 'INR',
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    this.logger.log(
      `PaymentIntent created for hotel booking | piId=${paymentIntent.id} | bookingNumber=${bookingNumber}`,
    );

    return {
      bookingNumber,
      bookingId: booking.id,
      totalAmount,
      clientSecret: paymentIntent.client_secret,
    };
  }
}
