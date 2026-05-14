import { Test, TestingModule } from '@nestjs/testing';
import { Status } from '../../../generated/prisma';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';

describe('DestinationsController', () => {
  let controller: DestinationsController;

  const destinationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestinationsController],
      providers: [
        {
          provide: DestinationsService,
          useValue: destinationsService,
        },
      ],
    }).compile();

    controller = module.get<DestinationsController>(DestinationsController);
  });

  it('delegates create to the service', async () => {
    const dto = {
      name: 'Bali',
      slug: 'bali',
      type: 'Beach',
      description: 'Island escape',
      status: Status.ACTIVE,
    };

    destinationsService.create.mockResolvedValue(dto);

    await expect(controller.create(dto)).resolves.toEqual(dto);
    expect(destinationsService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service with the parsed id', async () => {
    const dto = { name: 'Updated Bali', type: 'Island' };
    const updatedDestination = { id: 1, slug: 'bali', ...dto };

    destinationsService.update.mockResolvedValue(updatedDestination);

    await expect(controller.update(1, dto)).resolves.toEqual(updatedDestination);
    expect(destinationsService.update).toHaveBeenCalledWith(1, dto);
  });
});
