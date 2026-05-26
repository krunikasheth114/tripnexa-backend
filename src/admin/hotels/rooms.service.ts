import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Status } from '../../../generated/prisma';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(hotelId: number, dto: CreateRoomDto) {
    // Verify hotel exists
    await this.prisma.hotel.findFirstOrThrow({
      where: { id: hotelId, status: { not: Status.DELETED } },
    });

    return this.prisma.room.create({
      data: {
        ...dto,
        hotelId,
      },
    });
  }

  findAll(hotelId: number) {
    return this.prisma.room.findMany({
      where: {
        hotelId,
        status: { not: Status.DELETED },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(roomId: number, hotelId?: number) {
    const where: any = { id: roomId, status: { not: Status.DELETED } };
    if (hotelId) {
      where.hotelId = hotelId;
    }

    const room = await this.prisma.room.findFirst({ where });
    if (!room) throw new NotFoundException(`Room ${roomId} not found`);
    return room;
  }

  async update(roomId: number, hotelId: number, dto: UpdateRoomDto) {
    // Verify room belongs to hotel
    await this.findOne(roomId, hotelId);

    return this.prisma.room.update({
      where: { id: roomId },
      data: dto,
    });
  }

  async remove(roomId: number, hotelId: number) {
    // Verify room belongs to hotel
    await this.findOne(roomId, hotelId);

    return this.prisma.room.update({
      where: { id: roomId },
      data: { status: Status.DELETED },
    });
  }
}
