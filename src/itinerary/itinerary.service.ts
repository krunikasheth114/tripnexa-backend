import { Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

const ITINERARY_INCLUDE = {
  hotels: { include: { hotel: true } },
  meals: true,
  transfers: true,
  activities: true,
  gallery: true,
} as const;

@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateItineraryDto) {
    const { meals, transfers, activities, ...itineraryData } = dto;

    const itinerary = await this.prisma.itinerary.create({
      data: itineraryData,
    });

    if (meals?.length) {
      await this.prisma.itineraryMeal.createMany({
        data: meals.map((m) => ({ ...m, itineraryId: itinerary.id })),
        skipDuplicates: true,
      });
    }

    if (transfers?.length) {
      await this.prisma.itineraryTransfer.createMany({
        data: transfers.map((t) => ({ ...t, itineraryId: itinerary.id })),
      });
    }

    if (activities?.length) {
      await this.prisma.itineraryActivity.createMany({
        data: activities.map((a) => ({ ...a, itineraryId: itinerary.id })),
      });
    }

    return this.findById(itinerary.id);
  }

  async findByPackageId(packageId: number) {
    return this.prisma.itinerary.findMany({
      where: { packageId, deletedAt: null },
      orderBy: { dayNumber: 'asc' },
      include: ITINERARY_INCLUDE,
    });
  }

  async findById(id: number) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, deletedAt: null },
      include: ITINERARY_INCLUDE,
    });

    if (!itinerary) throw new NotFoundException('Itinerary not found');
    return itinerary;
  }

  async update(id: number, dto: UpdateItineraryDto) {
    await this.findById(id);
    const { meals, transfers, activities, ...itineraryData } = dto;

    await this.prisma.itinerary.update({ where: { id }, data: itineraryData });

    if (meals !== undefined) {
      await this.prisma.itineraryMeal.deleteMany({ where: { itineraryId: id } });
      if (meals.length) {
        await this.prisma.itineraryMeal.createMany({
          data: meals.map((m) => ({ ...m, itineraryId: id })),
          skipDuplicates: true,
        });
      }
    }

    if (transfers !== undefined) {
      await this.prisma.itineraryTransfer.deleteMany({ where: { itineraryId: id } });
      if (transfers.length) {
        await this.prisma.itineraryTransfer.createMany({
          data: transfers.map((t) => ({ ...t, itineraryId: id })),
        });
      }
    }

    if (activities !== undefined) {
      await this.prisma.itineraryActivity.deleteMany({ where: { itineraryId: id } });
      if (activities.length) {
        await this.prisma.itineraryActivity.createMany({
          data: activities.map((a) => ({ ...a, itineraryId: id })),
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: number) {
    await this.findById(id);
    return this.prisma.itinerary.update({
      where: { id },
      data: { deletedAt: new Date(), status: Status.DELETED },
    });
  }
}
