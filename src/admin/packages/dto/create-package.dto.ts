// create-package.dto.ts
import { IsString, IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreatePackageDto {
  @IsNumber()
  destinationId!: number;

  @IsString()
  title!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsNumber()
  days!: number;

  @IsNumber()
  nights!: number;

  @IsOptional()
  @IsArray()
  tags?: string[];

  /**
   * Hierarchical inclusions JSON.
   * Shape: { meals?: string[], accommodation?: string[], transport?: string[], activities?: true, ... }
   */
  @IsOptional()
  @IsObject()
  inclusions?: Record<string, unknown>;

  /**
   * Hierarchical exclusions JSON — same shape as inclusions.
   * Typically derived automatically from the full options minus inclusions.
   */
  @IsOptional()
  @IsObject()
  exclusions?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  primaryHotelId?: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
