import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class BulkImportItineraryRowDto {
  // Package resolved by title OR id — one required
  @IsOptional()
  @IsString()
  packageTitle?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  packageId?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  dayNumber!: number;

  @IsOptional()
  @IsString()
  dayTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // All come as comma-separated strings from Excel:
  // meals: "BREAKFAST,DINNER"  → [{ mealType: 'BREAKFAST' }, { mealType: 'DINNER' }]
  // activities: "SIGHTSEEING,TREKKING" → [{ activityType: 'SIGHTSEEING' }, ...]
  // activityTitles: "Heritage Walk,Mountain Trek" → parallel array for activity titles
  // transfers: "AIRPORT_PICKUP,HOTEL_TRANSFER" → [{ transferType: 'AIRPORT_PICKUP' }, ...]
  // transferPickup: pickup location for first transfer
  // transferDrop: drop location for first transfer
  @IsOptional()
  @IsString()
  meals?: string;

  @IsOptional()
  @IsString()
  activities?: string;

  @IsOptional()
  @IsString()
  activityTitles?: string;

  @IsOptional()
  @IsString()
  transfers?: string;

  @IsOptional()
  @IsString()
  transferPickup?: string;

  @IsOptional()
  @IsString()
  transferDrop?: string;

  // Destination for this day (resolved by name during import)
  @IsOptional()
  @IsString()
  destinationName?: string;
}

export class BulkImportItineraryDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkImportItineraryRowDto)
  rows!: BulkImportItineraryRowDto[];
}
