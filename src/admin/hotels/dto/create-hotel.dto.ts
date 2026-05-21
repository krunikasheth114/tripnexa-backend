import { IsInt, IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '../../../../generated/prisma';

export class CreateHotelDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  starRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  perNightPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  destinationId?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
