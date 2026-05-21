import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';

export class BulkImportPackageRowDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  // Destination resolved by name OR id — one is required
  @IsOptional()
  @IsString()
  destinationName?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  destinationId?: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPrice?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  days!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  nights!: number;

  // Tags come as comma-separated strings from Excel, parsed to string[] in the service
  @IsOptional()
  @IsString()
  tags?: string;
}

export class BulkImportPackageDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkImportPackageRowDto)
  rows!: BulkImportPackageRowDto[];
}
