import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../utils/s3.service';
import type { Express } from 'express';
import { CreateGalleryDto } from './dto/create-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async uploadImage(file: Express.Multer.File, dto: CreateGalleryDto) {
    const uploadResult = await this.s3Service.uploadFile(file);

    return this.prisma.gallery.create({
      data: {
        url: dto.url || uploadResult.url,
        destinationId: dto.destinationId,
        packageId: dto.packageId,
        itineraryId: dto.itineraryId,
        position: dto.position,
      },
    });
  }
}