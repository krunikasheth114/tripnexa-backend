import { Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { BulkImportHotelDto } from './dto/bulk-import-hotel.dto';
import { BulkImportResult, BulkRowError } from '../shared/bulk-import.types';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHotelDto) {
    const { rooms: roomsData, ...hotelData } = dto;

    const hotel = await this.prisma.hotel.create({
      data: hotelData as any,
      include: {
        gallery: { where: { deletedAt: null }, orderBy: { position: 'asc' as const } },
        rooms: true,
      },
    });

    // Create rooms if provided
    if (roomsData && roomsData.length > 0) {
      await Promise.all(
        roomsData.map((roomData) =>
          this.prisma.room.create({
            data: {
              ...roomData,
              hotelId: hotel.id,
            },
          })
        )
      );

      // Fetch updated hotel with rooms
      return this.findOne(hotel.id);
    }

    return hotel;
  }

  private readonly hotelInclude = {
    gallery: { where: { deletedAt: null }, orderBy: { position: 'asc' as const } },
    rooms: { where: { status: { not: Status.DELETED } }, orderBy: { name: 'asc' as const } },
  };

  findAll(destinationId?: number) {
    return this.prisma.hotel.findMany({
      where: {
        status: { not: Status.DELETED },
        ...(destinationId ? { destinationId } : {}),
      },
      orderBy: { name: 'asc' },
      include: this.hotelInclude,
    });
  }

  async findOne(id: number) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id, status: { not: Status.DELETED } },
      include: this.hotelInclude,
    });
    if (!hotel) throw new NotFoundException(`Hotel with id ${id} not found`);
    return hotel;
  }

  async update(id: number, dto: UpdateHotelDto) {
    await this.findOne(id);
    // Remove rooms from dto as they can't be updated via hotel update
    const { rooms: _rooms, ...updateData } = dto as any;
    return this.prisma.hotel.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.hotel.update({
      where: { id },
      data: { status: Status.DELETED },
    });
  }

  async bulkImport(dto: BulkImportHotelDto): Promise<BulkImportResult> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: BulkRowError[] = [];

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      const rowNum = i + 1;

      // Validate name present
      if (!row.name || row.name.trim() === '') {
        failed++;
        errors.push({ row: rowNum, field: 'name', message: 'name is required' });
        continue;
      }

      try {
        // Skip if hotel with same name already exists (case-insensitive)
        const existing = await this.prisma.hotel.findFirst({
          where: { name: { equals: row.name, mode: 'insensitive' } },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Resolve destinationName → destinationId; auto-create if not found
        let destinationId = row.destinationId;
        const lookupName = (row.destinationName || row.city)?.trim();
        if (!destinationId && lookupName) {
          const dest = await this.prisma.destination.findFirst({
            where: {
              name: { equals: lookupName, mode: 'insensitive' },
              deletedAt: null,
            },
            select: { id: true },
          });

          if (dest) {
            destinationId = dest.id;
          } else {
            // Auto-create a new destination for this city
            const slug = lookupName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');

            const created = await this.prisma.destination.create({
              data: { name: lookupName, slug },
              select: { id: true },
            });
            destinationId = created.id;
          }
        }

        // Extract only valid hotel fields
        const { destinationName: _dn, destinationId: _did, ...baseData } = row as any;
        const hotelData = {
          name: baseData.name,
          city: baseData.city,
          address: baseData.address,
          starRating: baseData.starRating,
          description: baseData.description,
          ...(destinationId ? { destinationId } : {}),
        };
        await this.prisma.hotel.create({ data: hotelData });

        imported++;
      } catch (err: unknown) {
        failed++;
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ row: rowNum, message });
      }
    }

    return { imported, skipped, failed, errors };
  }
}
