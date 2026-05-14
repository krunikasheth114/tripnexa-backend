// packages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    // ✅ Create
    async create(dto: CreatePackageDto) {
        return this.prisma.package.create({
            data: dto,
        });
    }

    // ✅ Update
    async update(id: number, dto: UpdatePackageDto) {
        const existing = await this.prisma.package.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Package not found');
        }

        return this.prisma.package.update({
            where: { id },
            data: dto,
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
}