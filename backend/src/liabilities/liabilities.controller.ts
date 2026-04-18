import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LiabilitiesService } from './liabilities.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { CreateOverpaymentDto, BulkUpsertOverpaymentsDto } from './dto/create-overpayment.dto';

@Controller('liabilities')
export class LiabilitiesController {
  constructor(private readonly liabilitiesService: LiabilitiesService) {}

  // --- Properties ---

  @Get('properties')
  findAllProperties() {
    return this.liabilitiesService.findAllProperties();
  }

  @Post('properties')
  @UsePipes(new ValidationPipe({ transform: true }))
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.liabilitiesService.createProperty(dto);
  }

  @Put('properties/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateProperty(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.liabilitiesService.updateProperty(id, dto);
  }

  @Delete('properties/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeProperty(@Param('id') id: string) {
    return this.liabilitiesService.removeProperty(id);
  }

  // --- Liabilities ---

  @Get()
  findAllLiabilities() {
    return this.liabilitiesService.findAllLiabilities();
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  createLiability(@Body() dto: CreateLiabilityDto) {
    return this.liabilitiesService.createLiability(dto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateLiability(@Param('id') id: string, @Body() dto: UpdateLiabilityDto) {
    return this.liabilitiesService.updateLiability(id, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archiveLiability(@Param('id') id: string) {
    return this.liabilitiesService.archiveLiability(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLiability(@Param('id') id: string) {
    return this.liabilitiesService.removeLiability(id);
  }

  // --- Snapshots ---

  @Get('snapshots')
  findAllSnapshots(@Query('liabilityId') liabilityId?: string) {
    return this.liabilitiesService.findAllSnapshots(liabilityId);
  }

  @Post('snapshots')
  @UsePipes(new ValidationPipe({ transform: true }))
  createOrUpdateSnapshot(@Body() dto: CreateSnapshotDto) {
    return this.liabilitiesService.createOrUpdateSnapshot(dto);
  }

  @Delete('snapshots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSnapshot(@Param('id') id: string) {
    return this.liabilitiesService.removeSnapshot(id);
  }

  // --- Overpayments ---

  @Get('overpayments')
  findAllOverpayments(@Query('liabilityId') liabilityId?: string) {
    return this.liabilitiesService.findAllOverpayments(liabilityId);
  }

  @Post('overpayments')
  @UsePipes(new ValidationPipe({ transform: true }))
  createOrUpdateOverpayment(@Body() dto: CreateOverpaymentDto) {
    return this.liabilitiesService.createOrUpdateOverpayment(dto);
  }

  @Post('overpayments/bulk')
  @UsePipes(new ValidationPipe({ transform: true }))
  bulkUpsertOverpayments(@Body() dto: BulkUpsertOverpaymentsDto) {
    return this.liabilitiesService.bulkUpsertOverpayments(dto);
  }

  @Delete('overpayments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOverpayment(@Param('id') id: string) {
    return this.liabilitiesService.removeOverpayment(id);
  }
}
