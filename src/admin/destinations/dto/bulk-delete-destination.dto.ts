import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class BulkDeleteDestinationDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    ids: number[];
}
