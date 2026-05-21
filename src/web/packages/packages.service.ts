import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Status } from '../../../generated/prisma';

const ITINERARY_INCLUDE = {
  meals: true,
  transfers: true,
  activities: true,
  gallery: { where: { deletedAt: null }, orderBy: { position: 'asc' as const } },
  hotels: { include: { hotel: { select: { id: true, name: true, starRating: true, city: true } } } },
  destination: { select: { id: true, name: true, type: true, parentId: true } },
} as const;

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Paginated list of packages with optional filters. */
  async findAll(params: {
    destinationId?: number;
    minDays?: number;
    maxDays?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 9), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      status: Status.ACTIVE,
    };
    if (params.destinationId) where.destinationId = params.destinationId;
    if (params.minDays || params.maxDays) {
      where.days = {};
      if (params.minDays) (where.days as Record<string, unknown>).gte = params.minDays;
      if (params.maxDays) (where.days as Record<string, unknown>).lte = params.maxDays;
    }
    if (params.minPrice || params.maxPrice) {
      where.price = {};
      if (params.minPrice) (where.price as Record<string, unknown>).gte = params.minPrice;
      if (params.maxPrice) (where.price as Record<string, unknown>).lte = params.maxPrice;
    }

    const include = {
      gallery: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' as const },
        take: 1,
      },
      destination: {
        select: { id: true, name: true, slug: true, type: true },
      },
    };

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' as const },
        include,
      }),
      this.prisma.package.count({ where }),
    ]);

    return {
      data: packages,
      total,
      page,
      limit,
      hasMore: skip + packages.length < total,
    };
  }

  /** Returns a single active package with full itinerary details. */
  async findById(id: number) {
    const pkg = await this.prisma.package.findFirst({
      where: { id, deletedAt: null, status: Status.ACTIVE },
      include: {
        gallery: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' as const },
        },
        destination: {
          select: { id: true, name: true, slug: true, type: true, parentId: true },
        },
        primaryHotel: {
          select: { id: true, name: true, starRating: true, city: true },
        },
        itineraries: {
          where: { deletedAt: null },
          orderBy: { dayNumber: 'asc' as const },
          include: ITINERARY_INCLUDE,
        },
      },
    });

    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  /** Returns featured packages for the home page.
   *  Falls back to the 8 most-recent active packages when none are featured. */
  async findFeatured() {
    const baseWhere = { deletedAt: null, status: Status.ACTIVE };

    const include = {
      gallery: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' as const },
        take: 1,
      },
      destination: {
        select: { id: true, name: true, slug: true, type: true },
      },
      itineraries: {
        where: { deletedAt: null },
        orderBy: { dayNumber: 'asc' as const },
        select: { id: true, dayNumber: true },
        take: 1,
      },
    };

    // Try featured first
    const featured = await this.prisma.package.findMany({
      where: { ...baseWhere, featured: true },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      include,
    });

    if (featured.length > 0) return featured;

    // Fallback: latest 8 active packages
    return this.prisma.package.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 8,
      include,
    });
  }
}
