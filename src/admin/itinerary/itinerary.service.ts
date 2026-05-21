import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, MealType, Status, TransferType } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { BulkImportItineraryDto } from './dto/bulk-import-itinerary.dto';
import { BulkImportResult, BulkRowError } from '../shared/bulk-import.types';

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
    const { meals, transfers, activities, hotels, ...itineraryData } = dto;

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

    if (hotels?.length) {
      await this.prisma.itineraryHotel.createMany({
        data: hotels.map((h) => ({ ...h, itineraryId: itinerary.id })),
        skipDuplicates: true,
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
    const { meals, transfers, activities, hotels, ...itineraryData } = dto;

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

    if (hotels !== undefined) {
      await this.prisma.itineraryHotel.deleteMany({ where: { itineraryId: id } });
      if (hotels.length) {
        await this.prisma.itineraryHotel.createMany({
          data: hotels.map((h) => ({ ...h, itineraryId: id })),
          skipDuplicates: true,
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

  // ✅ Resolve package by title or id — does NOT auto-create
  private async resolvePackage(title?: string, id?: number): Promise<number | null> {
    if (id) return id;
    if (!title) return null;
    const found = await this.prisma.package.findFirst({
      where: { title: { equals: title.trim(), mode: 'insensitive' }, deletedAt: null },
    });
    return found?.id ?? null;
  }

  // ✅ Parse comma-separated MealType string
  private parseMeals(raw?: string): { mealType: MealType }[] {
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => Object.values(MealType).includes(s as MealType))
      .map((s) => ({ mealType: s as MealType }));
  }

  // ✅ Parse comma-separated ActivityType string with optional parallel titles
  private parseActivities(
    typesRaw?: string,
    titlesRaw?: string,
  ): { activityType: ActivityType; title?: string }[] {
    if (!typesRaw) return [];
    const types = typesRaw.split(',').map((s) => s.trim().toUpperCase());
    const titles = titlesRaw ? titlesRaw.split(',').map((s) => s.trim()) : [];
    return types
      .map((t, idx) => ({ type: t, title: titles[idx] }))
      .filter(({ type }) => Object.values(ActivityType).includes(type as ActivityType))
      .map(({ type, title }) => ({
        activityType: type as ActivityType,
        ...(title ? { title } : {}),
      }));
  }

  // ✅ Parse comma-separated TransferType string with pickup/drop for first transfer
  private parseTransfers(
    typesRaw?: string,
    pickup?: string,
    drop?: string,
  ): { transferType: TransferType; pickupLocation?: string; dropLocation?: string }[] {
    if (!typesRaw) return [];
    return typesRaw
      .split(',')
      .map((s, idx) => ({ type: s.trim().toUpperCase(), idx }))
      .filter(({ type }) => Object.values(TransferType).includes(type as TransferType))
      .map(({ type, idx }) => ({
        transferType: type as TransferType,
        ...(idx === 0 && pickup ? { pickupLocation: pickup } : {}),
        ...(idx === 0 && drop ? { dropLocation: drop } : {}),
      }));
  }

  // ✅ Bulk import itineraries
  async bulkImport(dto: BulkImportItineraryDto): Promise<BulkImportResult> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: BulkRowError[] = [];

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      const rowNum = i + 1;

      // Validate dayNumber
      if (row.dayNumber == null || isNaN(Number(row.dayNumber)) || Number(row.dayNumber) < 1) {
        failed++;
        errors.push({ row: rowNum, field: 'dayNumber', message: 'dayNumber is required and must be >= 1' });
        continue;
      }

      try {
        // Resolve packageId — error (don't skip) if not found
        const packageId = await this.resolvePackage(row.packageTitle, row.packageId);

        if (packageId == null) {
          failed++;
          const label = row.packageTitle ? `'${row.packageTitle}'` : `id ${row.packageId}`;
          errors.push({ row: rowNum, message: `Package ${label} not found` });
          continue;
        }

        // Skip if itinerary with same packageId + dayNumber already exists
        const existing = await this.prisma.itinerary.findFirst({
          where: { packageId, dayNumber: Number(row.dayNumber), deletedAt: null },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Parse comma-separated fields, silently skip invalid enum values
        const meals = this.parseMeals(row.meals);
        const activities = this.parseActivities(row.activities, row.activityTitles);
        const transfers = this.parseTransfers(row.transfers, row.transferPickup, row.transferDrop);

        // Resolve destinationName → destinationId if provided
        let destinationId: number | undefined;
        if (row.destinationName) {
          const dest = await this.prisma.destination.findFirst({
            where: {
              name: { equals: row.destinationName.trim(), mode: 'insensitive' },
              deletedAt: null,
            },
            select: { id: true },
          });
          if (dest) destinationId = dest.id;
        }

        // Create itinerary (same pattern as existing create())
        const itinerary = await this.prisma.itinerary.create({
          data: {
            packageId,
            dayNumber: Number(row.dayNumber),
            dayTitle: row.dayTitle,
            description: row.description,
            ...(destinationId ? { destinationId } : {}),
          },
        });

        if (meals.length) {
          await this.prisma.itineraryMeal.createMany({
            data: meals.map((m) => ({ ...m, itineraryId: itinerary.id })),
            skipDuplicates: true,
          });
        }

        if (transfers.length) {
          await this.prisma.itineraryTransfer.createMany({
            data: transfers.map((t) => ({ ...t, itineraryId: itinerary.id })),
          });
        }

        if (activities.length) {
          await this.prisma.itineraryActivity.createMany({
            data: activities.map((a) => ({ ...a, itineraryId: itinerary.id })),
          });
        }

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
