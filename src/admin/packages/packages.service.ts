// packages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { BulkImportPackageDto } from './dto/bulk-import-package.dto';
import { BulkImportResult, BulkRowError } from '../shared/bulk-import.types';

/** Cast a plain object to Prisma InputJsonValue, or return undefined */
function toJson(v: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
    return v as Prisma.InputJsonValue | undefined;
}

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    // ✅ Create
    async create(dto: CreatePackageDto) {
        return this.prisma.package.create({
            data: {
                destinationId: dto.destinationId,
                title:         dto.title,
                slug:          dto.slug,
                description:   dto.description,
                price:         dto.price,
                discountPrice: dto.discountPrice,
                days:          dto.days,
                nights:        dto.nights,
                tags:          dto.tags,
                inclusions:    toJson(dto.inclusions),
                exclusions:    toJson(dto.exclusions),
                primaryHotelId: dto.primaryHotelId,
            },
        });
    }

    // ✅ Update
    async update(id: number, dto: UpdatePackageDto) {
        const existing = await this.prisma.package.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Package not found');

        return this.prisma.package.update({
            where: { id },
            data: {
                ...(dto.destinationId !== undefined && { destinationId: dto.destinationId }),
                ...(dto.title         !== undefined && { title:         dto.title         }),
                ...(dto.slug          !== undefined && { slug:          dto.slug          }),
                ...(dto.description   !== undefined && { description:   dto.description   }),
                ...(dto.price         !== undefined && { price:         dto.price         }),
                ...(dto.discountPrice !== undefined && { discountPrice: dto.discountPrice }),
                ...(dto.days          !== undefined && { days:          dto.days          }),
                ...(dto.nights        !== undefined && { nights:        dto.nights        }),
                ...(dto.tags          !== undefined && { tags:          dto.tags          }),
                ...(dto.inclusions    !== undefined && { inclusions:    toJson(dto.inclusions) }),
                ...(dto.exclusions    !== undefined && { exclusions:    toJson(dto.exclusions) }),
                ...(dto.primaryHotelId !== undefined && { primaryHotelId: dto.primaryHotelId }),
            },
        });
    }

    // ✅ Set Featured
    async setFeatured(id: number, featured: boolean) {
        const existing = await this.prisma.package.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Package not found');
        return this.prisma.package.update({
            where: { id },
            data: { featured },
        });
    }

    // ✅ Delete (soft delete)
    async delete(id: number) {
        const existing = await this.prisma.package.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Package not found');
        }

        return this.prisma.package.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    // ✅ List all packages (optionally filtered by destinationId)
    async findAll(destinationId?: number) {
        return this.prisma.package.findMany({
            where: {
                deletedAt: null,
                ...(destinationId ? { destinationId } : {}),
            },
            include: {
                destination: true,
                gallery: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ✅ Find package by id
    async findOne(id: number) {
        const pkg = await this.prisma.package.findFirst({
            where: {
                id,
                deletedAt: null, // important (soft delete)
            },
            include: {
                destination: true,
                gallery: true,
                itineraries: true,
            },
        });
        if (!pkg) {
            throw new NotFoundException('Package not found');
        }
        return pkg;
    }

    // ✅ Resolve destination by name or id
    private async resolveDestination(name?: string, id?: number): Promise<number | null> {
        if (id) return id;
        if (!name) return null;
        const found = await this.prisma.destination.findFirst({
            where: { name: { equals: name.trim(), mode: 'insensitive' }, deletedAt: null },
        });
        if (found) return found.id;
        // NOT FOUND → create minimal destination
        const created = await this.prisma.destination.create({
            data: {
                name: name.trim(),
                slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            },
        });
        return created.id;
    }

    // ✅ Bulk import packages
    async bulkImport(dto: BulkImportPackageDto): Promise<BulkImportResult> {
        let imported = 0;
        let skipped = 0;
        let failed = 0;
        const errors: BulkRowError[] = [];

        for (let i = 0; i < dto.rows.length; i++) {
            const row = dto.rows[i];
            const rowNum = i + 1;

            // Validate required fields
            if (!row.title || row.title.trim() === '') {
                failed++;
                errors.push({ row: rowNum, field: 'title', message: 'title is required' });
                continue;
            }

            if (row.price == null || isNaN(Number(row.price))) {
                failed++;
                errors.push({ row: rowNum, field: 'price', message: 'price must be a positive number' });
                continue;
            }

            if (row.days == null || isNaN(Number(row.days)) || Number(row.days) < 1) {
                failed++;
                errors.push({ row: rowNum, field: 'days', message: 'days must be a positive integer' });
                continue;
            }

            if (row.nights == null || isNaN(Number(row.nights)) || Number(row.nights) < 0) {
                failed++;
                errors.push({ row: rowNum, field: 'nights', message: 'nights must be a non-negative integer' });
                continue;
            }

            try {
                // Resolve destination
                const destinationId = await this.resolveDestination(row.destinationName, row.destinationId);

                if (destinationId == null) {
                    failed++;
                    errors.push({ row: rowNum, field: 'destinationName', message: 'destinationName or destinationId is required' });
                    continue;
                }

                // Generate slug if not provided
                const slug = row.slug?.trim() ||
                    row.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                // Skip if package with same slug already exists
                const existing = await this.prisma.package.findFirst({
                    where: { slug, deletedAt: null },
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                // Parse comma-separated tags string to string[]
                const parseCsv = (raw?: string): string[] =>
                    raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];

                const tags = parseCsv(row.tags);

                await this.prisma.package.create({
                    data: {
                        destinationId,
                        title: row.title.trim(),
                        slug,
                        description: row.description,
                        price: Number(row.price),
                        discountPrice: row.discountPrice != null ? Number(row.discountPrice) : undefined,
                        days: Number(row.days),
                        nights: Number(row.nights),
                        tags,
                    },
                });

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