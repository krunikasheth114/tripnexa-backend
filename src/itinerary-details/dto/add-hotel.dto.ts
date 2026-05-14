import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AddHotelDto {
  @IsInt()
  @Type(() => Number)
  itineraryId!: number;

  @IsInt()
  @Type(() => Number)
  hotelId!: number;

  @IsOptional()
  @IsBoolean()
  checkIn?: boolean;

  @IsOptional()
  @IsBoolean()
  checkOut?: boolean;

  @IsOptional()
  @IsString()
  roomType?: string;
}
