import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('web/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * POST /web/booking/create
   * Creates a booking and returns a Stripe clientSecret for payment.
   * Requires JWT auth.
   */
  @Post('create')
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateBookingDto, @Req() req: any) {
    const userId: number = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.bookingService.createBooking(dto, userId);
  }

  /**
   * GET /web/booking/my
   * Returns authenticated user's bookings.
   */
  @Get('my')
  @UseGuards(AuthGuard)
  myBookings(@Req() req: any) {
    const userId: number = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.bookingService.getMyBookings(userId);
  }

  /**
   * GET /web/booking/:bookingNumber
   * Returns a single booking by booking number.
   */
  @Get(':bookingNumber')
  @UseGuards(AuthGuard)
  getOne(@Param('bookingNumber') bookingNumber: string, @Req() req: any) {
    const userId: number = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.bookingService.getByBookingNumber(bookingNumber, userId);
  }

  /**
   * POST /web/booking/hotel
   * Creates a hotel booking and returns a Stripe clientSecret for payment.
   * Requires JWT auth.
   */
  @Post('hotel')
  @UseGuards(AuthGuard)
  createHotel(@Body() dto: CreateHotelBookingDto, @Req() req: any) {
    const userId: number = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.bookingService.createHotelBooking(dto, userId);
  }
}
