import { IsInt, IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '../../../../generated/prisma';
import { CreateRoomDto } from './create-room.dto';

export class CreateHotelDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  starRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  perNightPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minNights?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxGuests?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableMeals?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  destinationId?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomDto)
  rooms?: CreateRoomDto[];
}
