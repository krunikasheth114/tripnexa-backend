import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGalleryDto {

    @IsOptional()
    @IsString()
    url!: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    destinationId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    packageId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    itineraryId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    hotelId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    position?: number;
}
