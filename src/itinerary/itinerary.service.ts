import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { Status } from '../../generated/prisma';

@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  // ✅ Create
  async create(dto: CreateItineraryDto) {
    return this.prisma.itinerary.create({
      data: dto,
    });
  }

  // ✅ Get by packageId
  async findByPackageId(packageId: number) {
    return this.prisma.itinerary.findMany({
      where: {
        packageId,
        deletedAt: null,
      },
      orderBy: {
        dayNumber: 'asc',
      },
      include: {
        package: true, // optional
        gallery: true, // optional
      },
    });
  }

  // ✅ Get by ID
  async findById(id: number) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        package: true,
        gallery: true,
      },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    return itinerary;
  }

  // ✅ Update
  async update(id: number, dto: UpdateItineraryDto) {
    await this.findById(id); // ensure exists

    return this.prisma.itinerary.update({
      where: { id },
      data: dto,
    });
  }

  // ✅ Soft Delete
  async delete(id: number) {
    await this.findById(id);

    return this.prisma.itinerary.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status : Status.DELETED
      },
    });
  }
}