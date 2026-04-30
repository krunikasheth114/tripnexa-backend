import { CreateDestinationDto } from './create-destination.dto';

export class BulkCreateDestinationDto {
  declare destinations: CreateDestinationDto[];
}
