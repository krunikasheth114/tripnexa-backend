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
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BulkImportHotelDto } from './dto/bulk-import-hotel.dto';
import { HotelsService } from './hotels.service';
import { RoomsService } from './rooms.service';

@Controller('hotels')
export class HotelsController {
  constructor(
    private readonly hotelsService: HotelsService,
    private readonly roomsService: RoomsService,
  ) {}

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

  // ==============================
  // ROOM MANAGEMENT
  // ==============================

  @Post(':hotelId/rooms')
  createRoom(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(hotelId, dto);
  }

  @Get(':hotelId/rooms')
  findAllRooms(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.roomsService.findAll(hotelId);
  }

  @Get(':hotelId/rooms/:roomId')
  findOneRoom(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.roomsService.findOne(roomId, hotelId);
  }

  @Patch(':hotelId/rooms/:roomId')
  updateRoom(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(roomId, hotelId, dto);
  }

  @Delete(':hotelId/rooms/:roomId')
  removeRoom(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.roomsService.remove(roomId, hotelId);
  }
}
