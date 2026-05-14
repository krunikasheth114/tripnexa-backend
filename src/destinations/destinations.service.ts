import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Destination, Prisma, Status } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { BulkCreateDestinationDto } from './dto/bulk-create-destination.dto';
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

    const data: Prisma.DestinationCreateManyInput[] =
      bulkCreateDto.destinations.map((dto) => ({
        name: this.validateRequiredString(dto.name, 'name'),
        slug: this.validateRequiredString(dto.slug, 'slug'),
        ...(dto.type !== undefined
          ? { type: this.validateOptionalString(dto.type, 'type') }
          : {}),
        ...(dto.description !== undefined
          ? {
              description: this.validateOptionalString(
                dto.description,
                'description',
              ),
            }
          : {}),
        ...(dto.status !== undefined
          ? { status: this.validateStatus(dto.status) }
          : {}),
      }));

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
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.destination.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { gallery: true },
        skip,
        take: limit,
      }),
      this.prisma.destination.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
      slug: this.validateRequiredString(dto.slug, 'slug'),
      ...(dto.type !== undefined
        ? { type: this.validateOptionalString(dto.type, 'type') }
        : {}),
      ...(dto.description !== undefined
        ? { description: this.validateOptionalString(dto.description, 'description') }
        : {}),
      ...(dto.status !== undefined
        ? { status: this.validateStatus(dto.status) }
        : {}),
    };
  }

  private buildUpdateData(
    dto: UpdateDestinationDto,
  ): Prisma.DestinationUpdateInput {
    const data: Prisma.DestinationUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = this.validateRequiredString(dto.name, 'name');
    }

    if (dto.slug !== undefined) {
      data.slug = this.validateRequiredString(dto.slug, 'slug');
    }

    if (dto.type !== undefined) {
      data.type = this.validateOptionalString(dto.type, 'type');
    }

    if (dto.description !== undefined) {
      data.description = this.validateOptionalString(dto.description, 'description');
    }

    if (dto.status !== undefined) {
      data.status = this.validateStatus(dto.status);
    }

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
