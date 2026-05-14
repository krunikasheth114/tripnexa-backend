import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddHotelDto } from './dto/add-hotel.dto';

@Injectable()
export class ItineraryDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async addHotel(dto: AddHotelDto) {
    await this.ensureItineraryExists(dto.itineraryId);
    return this.prisma.itineraryHotel.create({ data: dto });
  }

  async removeHotel(id: number) {
    await this.ensureItineraryHotelExists(id);
    return this.prisma.itineraryHotel.delete({ where: { id } });
  }

  private async ensureItineraryExists(itineraryId: number) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, deletedAt: null },
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with id ${itineraryId} not found`);
    }
  }

  private async ensureItineraryHotelExists(id: number) {
    const record = await this.prisma.itineraryHotel.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ItineraryHotel with id ${id} not found`);
    }
  }
}
