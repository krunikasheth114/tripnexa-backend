import { Status } from '../../../generated/prisma';

export class UpdateDestinationDto {
  declare name?: string;
  declare slug?: string;
  declare type?: string;
  declare description?: string;
  declare status?: Status;
}
