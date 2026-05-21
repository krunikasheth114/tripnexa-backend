import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Destination, Prisma, Status } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkCreateDestinationDto, BulkImportDestinationRowDto } from './dto/bulk-create-destination.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDestinationDto: CreateDestinationDto) {
    const data = this.buildCreateData(createDestinationDto);

    try {
      return await this.prisma.destination.create({ data });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async bulkCreate(bulkCreateDto: BulkCreateDestinationDto) {
    if (
      !Array.isArray(bulkCreateDto.destinations) ||
      bulkCreateDto.destinations.length === 0
    ) {
      throw new BadRequestException('destinations must be a non-empty array');
    }

    // ── Pre-resolve parentName → parentId ────────────────────────────
    const parentNames = [
      ...new Set(
        bulkCreateDto.destinations
          .map((d: BulkImportDestinationRowDto) => d.parentName)
          .filter((n): n is string => !!n),
      ),
    ];

    const parentNameToId = new Map<string, number>();
    if (parentNames.length > 0) {
      const parents = await this.prisma.destination.findMany({
        where: { name: { in: parentNames }, parentId: null, deletedAt: null },
        select: { id: true, name: true },
      });
      for (const p of parents) {
        parentNameToId.set(p.name, p.id);
      }
    }

    // ── Build createMany input ────────────────────────────────────────
    const data: Prisma.DestinationCreateManyInput[] =
      bulkCreateDto.destinations.map((dto: BulkImportDestinationRowDto) => {
        // Resolve parentId: explicit id takes priority, then name lookup
        let parentId: number | undefined = dto.parentId;
        if (!parentId && dto.parentName) {
          const resolved = parentNameToId.get(dto.parentName);
          if (resolved) parentId = resolved;
        }

        return {
          name: this.validateRequiredString(dto.name, 'name'),
          ...(dto.slug ? { slug: dto.slug } : {}),
          ...(dto.type ? { type: dto.type } : {}),
          ...(parentId ? { parentId } : {}),
          ...(dto.description ? { description: dto.description } : {}),
          ...(dto.seasonalTags?.length ? { seasonalTags: dto.seasonalTags } : {}),
          ...(dto.formattedAddress ? { formattedAddress: dto.formattedAddress } : {}),
          ...(dto.latitude != null ? { latitude: dto.latitude } : {}),
          ...(dto.longitude != null ? { longitude: dto.longitude } : {}),
          ...(dto.placeId ? { placeId: dto.placeId } : {}),
          ...(dto.status ? { status: this.validateStatus(dto.status) } : {}),
        };
      });

    try {
      const result = await this.prisma.destination.createMany({
        data,
        skipDuplicates: true,
      });
      return { created: result.count };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(page = 1, limit = 10) {
    const where = { deletedAt: null };

    // limit <= 0 → return flat array (used for dropdowns, no pagination wrapper)
    if (limit <= 0) {
      return this.prisma.destination.findMany({
        where,
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, type: true, parentId: true, status: true },
      });
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.destination.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { gallery: true, parent: { select: { id: true, name: true } } },
        skip,
        take: limit,
      }),
      this.prisma.destination.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    return this.findActiveDestinationOrThrow(id);
  }

  async update(id: number, updateDestinationDto: UpdateDestinationDto) {
    await this.findActiveDestinationOrThrow(id);
    const data = this.buildUpdateData(updateDestinationDto);

    try {
      return await this.prisma.destination.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    await this.findActiveDestinationOrThrow(id);

    return this.prisma.destination.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkDelete(ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('ids must be a non-empty array');
    }

    const result = await this.prisma.destination.deleteMany({
      where: { id: { in: ids } },
    });

    return { deleted: result.count };
  }

  private async findActiveDestinationOrThrow(id: number): Promise<Destination> {
    const destination = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
    });

    if (!destination) {
      throw new NotFoundException(`Destination with id ${id} not found`);
    }

    return destination;
  }

  private buildCreateData(
    dto: CreateDestinationDto,
  ): Prisma.DestinationCreateInput {
    return {
      name: this.validateRequiredString(dto.name, 'name'),
      ...(dto.slug ? { slug: dto.slug } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.parentId !== undefined ? { parent: { connect: { id: dto.parentId } } } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.formattedAddress !== undefined ? { formattedAddress: dto.formattedAddress } : {}),
      ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
      ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
      ...(dto.placeId !== undefined ? { placeId: dto.placeId } : {}),
      ...(dto.seasonalTags !== undefined ? { seasonalTags: dto.seasonalTags } : {}),
      ...(dto.status !== undefined ? { status: this.validateStatus(dto.status) } : {}),
    };
  }

  private buildUpdateData(
    dto: UpdateDestinationDto,
  ): Prisma.DestinationUpdateInput {
    const data: Prisma.DestinationUpdateInput = {};

    if (dto.name !== undefined) data.name = this.validateRequiredString(dto.name, 'name');
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.formattedAddress !== undefined) data.formattedAddress = dto.formattedAddress;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.placeId !== undefined) data.placeId = dto.placeId;
    if (dto.seasonalTags !== undefined) data.seasonalTags = dto.seasonalTags;
    if (dto.status !== undefined) data.status = this.validateStatus(dto.status);

    return data;
  }

  private validateRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} must be a non-empty string`);
    }

    return value.trim();
  }

  private validateOptionalString(value: unknown, fieldName: string) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    return value.trim();
  }

  private validateStatus(value: unknown): Status {
    if (!Object.values(Status).includes(value as Status)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(Status).join(', ')}`,
      );
    }

    return value as Status;
  }

  private handlePrismaError(error: unknown): never {
    const code =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            typeof error.code === 'string'
          ? error.code
          : undefined;

    if (code === 'P2002') {
      throw new ConflictException('Destination slug already exists');
    }

    throw error;
  }
}
