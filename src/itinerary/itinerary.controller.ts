import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  // ✅ Create
  @Post()
  create(@Body() dto: CreateItineraryDto) {
    return this.itineraryService.create(dto);
  }

  // ✅ Get by Package ID
  @Get('package/:packageId')
  findByPackage(@Param('packageId') packageId: string) {
    return this.itineraryService.findByPackageId(Number(packageId));
  }

  // ✅ Get by Itinerary ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itineraryService.findById(Number(id));
  }

  // ✅ Update
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItineraryDto) {
    return this.itineraryService.update(Number(id), dto);
  }

  // ✅ Delete (soft delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itineraryService.delete(Number(id));
  }
}