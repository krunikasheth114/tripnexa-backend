// packages.controller.ts
import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Controller('packages')
export class PackagesController {
  constructor(private readonly service: PackagesService) {}

  // ✅ Create
  @Post()
  create(@Body() dto: CreatePackageDto) {
    return this.service.create(dto);
  }

  // ✅ Update
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePackageDto,
  ) {
    return this.service.update(id, dto);
  }

  // ✅ Delete
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

  // ✅ List by destinationId
  @Get()
  findByDestination(@Query('destinationId', ParseIntPipe) destinationId: number) {
    return this.service.findByDestination(destinationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}