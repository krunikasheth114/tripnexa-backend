import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Status } from '../../../generated/prisma';

const PAGE_SIZE = 9;

@Injectable()
export class HotelsWebService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    destinationId?: number;
    starRating?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      destinationId,
      starRating,
      minPrice,
      maxPrice,
      page = 1,
      limit = PAGE_SIZE,
    } = params;

    const where: Record<string, unknown> = {
      status: Status.ACTIVE,
      deletedAt: null,
      ...(destinationId ? { destinationId } : {}),
      ...(starRating ? { starRating } : {}),
    };

    // Price filter — only apply when perNightPrice is set
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.perNightPrice = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy: [{ starRating: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: {
          gallery: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
          },
          destination: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + data.length < total,
    };
  }
}
