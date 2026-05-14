import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, MealType, TransferType } from '../../../../generated/prisma';

export class MealDto {
  @IsEnum(MealType)
  mealType!: MealType;
}

export class TransferDto {
  @IsEnum(TransferType)
  transferType!: TransferType;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  dropLocation?: string;

  @IsOptional()
  @IsDateString()
  pickupTime?: string;

  @IsOptional()
  @IsDateString()
  dropTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ActivityDto {
  @IsEnum(ActivityType)
  activityType!: ActivityType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}

export class CreateItineraryDto {
  @IsInt()
  @Type(() => Number)
  packageId!: number;

  @IsInt()
  @Type(() => Number)
  dayNumber!: number;

  @IsOptional()
  @IsString()
  dayTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals?: MealDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferDto)
  transfers?: TransferDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities?: ActivityDto[];
}
