// create-package.dto.ts
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

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
  @IsString()
  accommodationType?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}