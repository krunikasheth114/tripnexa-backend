import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Status } from '../../../generated/prisma';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.destination.findMany({
      where: { status: Status.ACTIVE, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, type: true },
    });
  }

  /** Paginated list of destinations with optional type filter. */
  async findAllPaginated(params: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 12), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: Status.ACTIVE,
      deletedAt: null,
    };
    if (params.type) where.type = params.type;
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [destinations, total] = await Promise.all([
      this.prisma.destination.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          gallery: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' as const },
            take: 1,
            select: { url: true },
          },
          _count: {
            select: { packages: true },
          },
        },
      }),
      this.prisma.destination.count({ where }),
    ]);

    return {
      data: destinations,
      total,
      page,
      limit,
      hasMore: skip + destinations.length < total,
    };
  }

  /** Returns top destinations for the homepage cards with gallery + first itinerary link. */
  findForHomepage() {
    return this.prisma.destination.findMany({
      where: { status: Status.ACTIVE, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        gallery: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
          take: 1,
          select: { url: true },
        },
        packages: {
          where: { status: Status.ACTIVE, deletedAt: null },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            itineraries: {
              where: { deletedAt: null },
              orderBy: { dayNumber: 'asc' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });
  }
}
