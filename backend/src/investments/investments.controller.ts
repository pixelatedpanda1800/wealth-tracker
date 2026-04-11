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
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { UpdateSnapshotDto } from './dto/update-snapshot.dto';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // --- Holdings ---

  @Get('holdings')
  findAllHoldings() {
    return this.investmentsService.findAllHoldings();
  }

  @Post('holdings')
  @UsePipes(new ValidationPipe({ transform: true }))
  createHolding(@Body() dto: CreateHoldingDto) {
    return this.investmentsService.createHolding(dto);
  }

  @Put('holdings/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateHolding(@Param('id') id: string, @Body() dto: UpdateHoldingDto) {
    return this.investmentsService.updateHolding(id, dto);
  }

  @Delete('holdings/:id')
  removeHolding(@Param('id') id: string) {
    return this.investmentsService.removeHolding(id);
  }

  // --- Snapshots ---

  @Get('snapshots')
  findAllSnapshots(@Query('holdingId') holdingId?: string) {
    return this.investmentsService.findAllSnapshots(holdingId);
  }

  @Post('snapshots')
  @UsePipes(new ValidationPipe({ transform: true }))
  createOrUpdateSnapshot(@Body() dto: CreateSnapshotDto) {
    return this.investmentsService.createOrUpdateSnapshot(dto);
  }

  @Delete('snapshots/:id')
  removeSnapshot(@Param('id') id: string) {
    return this.investmentsService.removeSnapshot(id);
  }
}
