import { ArrayNotEmpty, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateDestinationDto } from './create-destination.dto';
import { Type } from 'class-transformer';

// Extended row DTO — adds parentName so bulk import can resolve by name
export class BulkImportDestinationRowDto extends CreateDestinationDto {
  @IsOptional()
  @IsString()
  parentName?: string;
}

export class BulkCreateDestinationDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BulkImportDestinationRowDto)
    destinations: BulkImportDestinationRowDto[];
}
