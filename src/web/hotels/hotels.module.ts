import { Module } from '@nestjs/common';
import { HotelsWebController } from './hotels.controller';
import { HotelsWebService } from './hotels.service';

@Module({
  controllers: [HotelsWebController],
  providers: [HotelsWebService],
})
export class HotelsWebModule {}
