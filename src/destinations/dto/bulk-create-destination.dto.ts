import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { CreateDestinationDto } from './create-destination.dto';
import { Type } from 'class-transformer';

export class BulkCreateDestinationDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateDestinationDto)
    destinations: CreateDestinationDto[];
}
