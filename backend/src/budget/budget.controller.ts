import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { CreateOutgoingDto, UpdateOutgoingDto } from './dto/outgoing.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { CreateAllocationDto, UpdateAllocationDto } from './dto/allocation.dto';
import { CreateIncomeTransferDto, UpdateIncomeTransferDto } from './dto/income-transfer.dto';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) { }

  // === INCOMES ===
  @Get('incomes')
  findAllIncomes() {
    return this.budgetService.findAllIncomes();
  }

  @Post('incomes')
  createIncome(@Body() dto: CreateIncomeDto) {
    return this.budgetService.createIncome(dto);
  }

  @Put('incomes/:id')
  updateIncome(@Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.budgetService.updateIncome(id, dto);
  }

  @Delete('incomes/:id')
  deleteIncome(@Param('id') id: string) {
    return this.budgetService.deleteIncome(id);
  }

  // === OUTGOINGS ===
  @Get('outgoings')
  findAllOutgoings() {
    return this.budgetService.findAllOutgoings();
  }

  @Post('outgoings')
  createOutgoing(@Body() dto: CreateOutgoingDto) {
    return this.budgetService.createOutgoing(dto);
  }

  @Put('outgoings/:id')
  updateOutgoing(@Param('id') id: string, @Body() dto: UpdateOutgoingDto) {
    return this.budgetService.updateOutgoing(id, dto);
  }

  @Delete('outgoings/:id')
  deleteOutgoing(@Param('id') id: string) {
    return this.budgetService.deleteOutgoing(id);
  }

  // === ACCOUNTS ===
  @Get('accounts')
  findAllAccounts() {
    return this.budgetService.findAllAccounts();
  }

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.budgetService.createAccount(dto);
  }

  @Put('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.budgetService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string) {
    return this.budgetService.deleteAccount(id);
  }

  // === ALLOCATIONS ===
  @Get('allocations')
  findAllAllocations() {
    return this.budgetService.findAllAllocations();
  }

  @Post('allocations')
  createAllocation(@Body() dto: CreateAllocationDto) {
    return this.budgetService.createAllocation(dto);
  }

  @Put('allocations/:id')
  updateAllocation(@Param('id') id: string, @Body() dto: UpdateAllocationDto) {
    return this.budgetService.updateAllocation(id, dto);
  }

  @Delete('allocations/:id')
  deleteAllocation(@Param('id') id: string) {
    return this.budgetService.deleteAllocation(id);
  }

  // === INCOME TRANSFERS ===
  @Get('income-transfers')
  findAllIncomeTransfers() {
    return this.budgetService.findAllIncomeTransfers();
  }

  @Post('income-transfers')
  createIncomeTransfer(@Body() dto: CreateIncomeTransferDto) {
    return this.budgetService.createIncomeTransfer(dto);
  }

  @Put('income-transfers/:id')
  updateIncomeTransfer(@Param('id') id: string, @Body() dto: UpdateIncomeTransferDto) {
    return this.budgetService.updateIncomeTransfer(id, dto);
  }

  @Delete('income-transfers/:id')
  deleteIncomeTransfer(@Param('id') id: string) {
    return this.budgetService.deleteIncomeTransfer(id);
  }
}

