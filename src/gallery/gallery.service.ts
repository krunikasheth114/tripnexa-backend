import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../utils/s3.service';
import type { Express } from 'express';
import { CreateGalleryDto } from './dto/create-gallery.dto';

function getKeyFromUrl(url: string) {
  return url.split('.com/')[1];
}

@Injectable()
export class GalleryService {
    constructor(
        private prisma: PrismaService,
        private s3Service: S3Service,
    ) { }

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
    
    async deleteImage(id: number) {
        const image = await this.prisma.gallery.findUnique({
            where: { id },
        });
        if (!image) {
            throw new NotFoundException('Image not found');
        }

        // key = S3 file key
        const key = getKeyFromUrl(image.url);
        // 2. Delete from S3
        await this.s3Service.deleteFromS3(key); // key = S3 file key

        // 3. Delete from DB
        await this.prisma.gallery.delete({
            where: { id },
        });

        return {
            message: 'Image deleted successfully',
        };
    }
}