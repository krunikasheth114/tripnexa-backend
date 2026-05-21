import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDestinationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  // Category: WILDLIFE | HERITAGE | RELIGIOUS | BEACH | ADVENTURE | CULTURAL | CITY | REGION
  @IsOptional()
  @IsString()
  type?: string;

  // Hierarchy: null = state-level, filled = child of a state destination
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

  // Google Maps / Places
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
  status?: string;
}
