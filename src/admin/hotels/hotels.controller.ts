import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { BulkImportHotelDto } from './dto/bulk-import-hotel.dto';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post('bulk')
  bulkImport(@Body() dto: BulkImportHotelDto) {
    return this.hotelsService.bulkImport(dto);
  }

  @Post()
  create(@Body() dto: CreateHotelDto) {
    return this.hotelsService.create(dto);
  }

  @Get()
  findAll(@Query('destinationId') destinationId?: string) {
    return this.hotelsService.findAll(destinationId ? Number(destinationId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hotelsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHotelDto) {
    return this.hotelsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hotelsService.remove(id);
  }
}
