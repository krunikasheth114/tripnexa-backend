import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItineraryDto {
  @IsInt()
  @Type(() => Number)
  packageId!: number;

  @IsInt()
  @Type(() => Number)
  dayNumber!: number;

  @IsOptional()
  @IsString()
  dayTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  activities?: any; // JSON field (can refine later)
}