import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  type?: string;

  @IsString()
  description?: string;

  status?: string;
}