import {
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingGuestDto } from './create-booking.dto';

export class CreateHotelBookingDto {
  @IsInt()
  hotelId: number;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  totalRooms: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  totalGuests: number;

  @IsArray()
  @IsString({ each: true })
  meals: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  guests: BookingGuestDto[];

  @IsOptional()
  @IsString()
  specialRequest?: string;
}
