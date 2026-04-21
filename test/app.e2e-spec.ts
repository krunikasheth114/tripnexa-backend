import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Status } from '../generated/prisma';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/common/setup-app';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let destinations: Array<{
    id: number;
    name: string;
    slug: string;
    type: string | null;
    description: string | null;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;

  const prismaServiceMock = {
    destination: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    destinations = [];

    prismaServiceMock.destination.create.mockImplementation(
      async ({
        data,
      }: {
        data: {
          name: string;
          slug: string;
          type?: string;
          description?: string;
          status?: Status;
        };
      }) => {
        if (destinations.some((destination) => destination.slug === data.slug)) {
          throw { code: 'P2002' };
        }

        const destination = {
          id: destinations.length + 1,
          name: data.name,
          slug: data.slug,
          type: data.type ?? null,
          description: data.description ?? null,
          status: data.status ?? Status.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        destinations.push(destination);
        return destination;
      },
    );

    prismaServiceMock.destination.findMany.mockImplementation(
      async ({ where }: { where: { deletedAt: null } }) =>
        destinations
          .filter((destination) => destination.deletedAt === where.deletedAt)
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    );

    prismaServiceMock.destination.findFirst.mockImplementation(
      async ({ where }: { where: { id: number; deletedAt: null } }) =>
        destinations.find(
          (destination) =>
            destination.id === where.id && destination.deletedAt === where.deletedAt,
        ) ?? null,
    );

    prismaServiceMock.destination.update.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Partial<{
          name: string;
          slug: string;
          type: string;
          description: string;
          status: Status;
          deletedAt: Date;
        }>;
      }) => {
        const destination = destinations.find((item) => item.id === where.id);

        if (!destination) {
          throw new Error('Destination not found in mock');
        }

        if (
          data.slug &&
          destinations.some(
            (item) => item.id !== where.id && item.slug === data.slug,
          )
        ) {
          throw { code: 'P2002' };
        }

        Object.assign(destination, data, { updatedAt: new Date() });
        return destination;
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  it('runs the destination CRUD flow with soft delete', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/destinations')
      .send({
        name: 'Bali',
        slug: 'bali',
        type: 'Beach',
        description: 'Island escape',
        status: Status.ACTIVE,
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      status: 'success',
      statusCode: 201,
      data: {
        id: 1,
        name: 'Bali',
        slug: 'bali',
        type: 'Beach',
        description: 'Island escape',
        status: Status.ACTIVE,
        deletedAt: null,
      },
    });

    await request(app.getHttpServer())
      .get('/destinations')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.statusCode).toBe(200);
        expect(body.data).toHaveLength(1);
        expect(body.data[0].slug).toBe('bali');
        expect(body.data[0].type).toBe('Beach');
      });

    await request(app.getHttpServer())
      .get('/destinations/1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.data.id).toBe(1);
        expect(body.data.slug).toBe('bali');
        expect(body.data.type).toBe('Beach');
      });

    await request(app.getHttpServer())
      .patch('/destinations/1')
      .send({ name: 'Bali Updated', type: 'Island', status: Status.INACTIVE })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.data.name).toBe('Bali Updated');
        expect(body.data.type).toBe('Island');
        expect(body.data.status).toBe(Status.INACTIVE);
      });

    await request(app.getHttpServer())
      .delete('/destinations/1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.statusCode).toBe(200);
        expect(body.data.deletedAt).not.toBeNull();
      });

    await request(app.getHttpServer())
      .get('/destinations/1')
      .expect(404)
      .expect(({ body }) => {
        expect(body.status).toBe('error');
        expect(body.statusCode).toBe(404);
        expect(body.data.message).toBe('Destination with id 1 not found');
      });

    await request(app.getHttpServer())
      .get('/destinations')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.data).toEqual([]);
      });
  });

  it('rejects invalid numeric route params', () => {
    return request(app.getHttpServer())
      .get('/destinations/not-a-number')
      .expect(400)
      .expect(({ body }) => {
        expect(body.status).toBe('error');
        expect(body.statusCode).toBe(400);
        expect(body.data.message).toContain('Validation failed');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
