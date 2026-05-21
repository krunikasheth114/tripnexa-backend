import {
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum GenderDto {
  MALE   = 'MALE',
  FEMALE = 'FEMALE',
  OTHER  = 'OTHER',
}

export class BookingGuestDto {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsOptional()
  @IsEnum(GenderDto)
  gender?: GenderDto;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
}

export class CreateBookingDto {
  @IsInt()
  packageId: number;

  @IsDateString()
  travelDate: string;

  @IsInt()
  @Min(1)
  totalGuests: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  guests: BookingGuestDto[];

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsOptional()
  @IsString()
  fromState?: string;
}
