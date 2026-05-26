import { IsString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerNight!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxAdults!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxChildren!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  totalRooms!: number;
}
