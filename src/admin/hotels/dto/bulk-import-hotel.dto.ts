import { Type } from 'class-transformer';
import { IsArray, ArrayNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateHotelDto } from './create-hotel.dto';

// Extends CreateHotelDto with destinationName for name-based resolution during import
export class BulkImportHotelRowDto extends CreateHotelDto {
  @IsOptional()
  @IsString()
  destinationName?: string;
}

export class BulkImportHotelDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkImportHotelRowDto)
  rows!: BulkImportHotelRowDto[];
}
