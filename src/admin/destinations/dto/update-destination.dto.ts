import { IsArray, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '../../../../generated/prisma';

export class UpdateDestinationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  seasonalTags?: string[];

  @IsOptional()
  @IsString()
  formattedAddress?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  status?: Status;
}
