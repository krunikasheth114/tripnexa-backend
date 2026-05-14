import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Status } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { DestinationsService } from './destinations.service';

describe('DestinationsService', () => {
  let service: DestinationsService;

  const prismaService = {
    destination: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<DestinationsService>(DestinationsService);
  });

  it('creates a destination successfully', async () => {
    const createdDestination = {
      id: 1,
      name: 'Bali',
      slug: 'bali',
      type: 'Beach',
      description: 'Island escape',
      status: Status.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaService.destination.create.mockResolvedValue(createdDestination);

    await expect(
      service.create({
        name: '  Bali  ',
        slug: '  bali  ',
        type: '  Beach  ',
        description: '  Island escape  ',
        status: Status.ACTIVE,
      }),
    ).resolves.toEqual(createdDestination);

    expect(prismaService.destination.create).toHaveBeenCalledWith({
      data: {
        name: 'Bali',
        slug: 'bali',
        type: 'Beach',
        description: 'Island escape',
        status: Status.ACTIVE,
      },
    });
  });

  it('lists only non-deleted destinations', async () => {
    const destinations = [{ id: 1, name: 'Bali', slug: 'bali', type: 'Beach' }];
    prismaService.destination.findMany.mockResolvedValue(destinations);

    await expect(service.findAll()).resolves.toEqual(destinations);
    expect(prismaService.destination.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns one destination by id', async () => {
    const destination = {
      id: 1,
      name: 'Bali',
      slug: 'bali',
      type: 'Beach',
      description: null,
      status: Status.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaService.destination.findFirst.mockResolvedValue(destination);

    await expect(service.findOne(1)).resolves.toEqual(destination);
    expect(prismaService.destination.findFirst).toHaveBeenCalledWith({
      where: { id: 1, deletedAt: null },
    });
  });

  it('updates a destination successfully', async () => {
    const existingDestination = {
      id: 1,
      name: 'Bali',
      slug: 'bali',
      type: 'Beach',
      description: null,
      status: Status.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const updatedDestination = {
      ...existingDestination,
      name: 'Updated Bali',
      type: 'Island',
      status: Status.INACTIVE,
    };

    prismaService.destination.findFirst.mockResolvedValue(existingDestination);
    prismaService.destination.update.mockResolvedValue(updatedDestination);

    await expect(
      service.update(1, {
        name: '  Updated Bali  ',
        type: '  Island  ',
        status: Status.INACTIVE,
      }),
    ).resolves.toEqual(updatedDestination);

    expect(prismaService.destination.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Updated Bali',
        type: 'Island',
        status: Status.INACTIVE,
      },
    });
  });

  it('soft deletes a destination', async () => {
    const existingDestination = {
      id: 1,
      name: 'Bali',
      slug: 'bali',
      type: 'Beach',
      description: null,
      status: Status.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const deletedDestination = {
      ...existingDestination,
      deletedAt: new Date(),
    };

    prismaService.destination.findFirst.mockResolvedValue(existingDestination);
    prismaService.destination.update.mockResolvedValue(deletedDestination);

    await expect(service.remove(1)).resolves.toEqual(deletedDestination);
    expect(prismaService.destination.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('throws not found for missing destinations', async () => {
    prismaService.destination.findFirst.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws conflict when slug is duplicated', async () => {
    prismaService.destination.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({
        name: 'Bali',
        slug: 'bali',
        type: 'Beach',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid status values', async () => {
    await expect(
      service.create({
        name: 'Bali',
        slug: 'bali',
        type: 'Beach',
        status: 'BROKEN' as Status,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid type values', async () => {
    await expect(
      service.create({
        name: 'Bali',
        slug: 'bali',
        type: 123 as unknown as string,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
