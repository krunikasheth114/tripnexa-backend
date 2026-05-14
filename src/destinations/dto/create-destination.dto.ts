import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateDestinationDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    slug!: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    seasonalTags?: string[];

    @IsOptional()
    status?: string;
}