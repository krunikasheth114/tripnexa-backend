import { Status } from '../../../generated/prisma';

export class CreateDestinationDto {
  declare name: string;
  declare slug: string;
  declare type?: string;
  declare description?: string;
  declare status?: Status;
}
