import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService, RoomsService],
})
export class HotelsModule {}
