import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.bookingStatus = status;

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          package: {
            select: {
              id: true,
              title: true,
              days: true,
              nights: true,
              destination: { select: { id: true, name: true } },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: { select: { guests: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: {
          select: {
            id: true,
            title: true,
            slug: true,
            days: true,
            nights: true,
            price: true,
            discountPrice: true,
            destination: { select: { id: true, name: true } },
            gallery: {
              where: { deletedAt: null },
              orderBy: { position: 'asc' },
              take: 1,
            },
          },
        },
        guests: {
          orderBy: { id: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getStats() {
    const [total, confirmed, pending, cancelled, revenue] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { bookingStatus: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { bookingStatus: 'PENDING' } }),
      this.prisma.booking.count({ where: { bookingStatus: 'CANCELLED' } }),
      this.prisma.booking.aggregate({
        where: { bookingStatus: 'CONFIRMED' },
        _sum: { paidAmount: true },
      }),
    ]);

    return {
      total,
      confirmed,
      pending,
      cancelled,
      totalRevenue: revenue._sum.paidAmount ?? 0,
    };
  }
}
