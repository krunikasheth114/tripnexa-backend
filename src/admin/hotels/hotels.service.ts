import { Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateHotelDto) {
    return this.prisma.hotel.create({ data: dto });
  }

  findAll() {
    return this.prisma.hotel.findMany({
      where: { status: { not: Status.DELETED } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id, status: { not: Status.DELETED } },
    });
    if (!hotel) throw new NotFoundException(`Hotel with id ${id} not found`);
    return hotel;
  }

  async update(id: number, dto: UpdateHotelDto) {
    await this.findOne(id);
    return this.prisma.hotel.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.hotel.update({
      where: { id },
      data: { status: Status.DELETED },
    });
  }
}
