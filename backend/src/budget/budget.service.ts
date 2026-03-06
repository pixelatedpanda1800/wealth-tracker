import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeSource } from './entities/income-source.entity';
import { OutgoingSource } from './entities/outgoing-source.entity';
import { Account } from './entities/account.entity';
import { Allocation } from './entities/allocation.entity';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { CreateOutgoingDto, UpdateOutgoingDto } from './dto/outgoing.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { CreateAllocationDto, UpdateAllocationDto } from './dto/allocation.dto';
import { CreateIncomeTransferDto, UpdateIncomeTransferDto } from './dto/income-transfer.dto';
import { IncomeTransfer } from './entities/income-transfer.entity';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(IncomeSource)
    private readonly incomeRepository: Repository<IncomeSource>,
    @InjectRepository(OutgoingSource)
    private readonly outgoingRepository: Repository<OutgoingSource>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Allocation)
    private readonly allocationRepository: Repository<Allocation>,
    @InjectRepository(IncomeTransfer)
    private readonly incomeTransferRepository: Repository<IncomeTransfer>,
  ) { }

  // === INCOMES ===
  async findAllIncomes(): Promise<IncomeSource[]> {
    return this.incomeRepository.find();
  }

  async createIncome(dto: CreateIncomeDto): Promise<IncomeSource> {
    const income = this.incomeRepository.create(dto);
    return this.incomeRepository.save(income);
  }

  async updateIncome(id: string, dto: UpdateIncomeDto): Promise<IncomeSource> {
    await this.incomeRepository.update(id, dto);
    return this.incomeRepository.findOneByOrFail({ id });
  }

  async deleteIncome(id: string): Promise<void> {
    await this.incomeRepository.delete(id);
  }

  // === OUTGOINGS ===
  async findAllOutgoings(): Promise<OutgoingSource[]> {
    return this.outgoingRepository.find();
  }

  async createOutgoing(dto: CreateOutgoingDto): Promise<OutgoingSource> {
    const outgoing = this.outgoingRepository.create(dto);
    return this.outgoingRepository.save(outgoing);
  }

  async updateOutgoing(
    id: string,
    dto: UpdateOutgoingDto,
  ): Promise<OutgoingSource> {
    await this.outgoingRepository.update(id, dto);
    return this.outgoingRepository.findOneByOrFail({ id });
  }

  async deleteOutgoing(id: string): Promise<void> {
    await this.outgoingRepository.delete(id);
  }

  // === ACCOUNTS ===
  async findAllAccounts(): Promise<Account[]> {
    return this.accountRepository.find();
  }

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create(dto);
    return this.accountRepository.save(account);
  }

  async updateAccount(id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.accountRepository.update(id, dto);
    return this.accountRepository.findOneByOrFail({ id });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.accountRepository.delete(id);
  }

  // === ALLOCATIONS ===
  async findAllAllocations(): Promise<Allocation[]> {
    return this.allocationRepository.find({ relations: ['account'] });
  }

  async createAllocation(dto: CreateAllocationDto): Promise<Allocation> {
    const allocation = this.allocationRepository.create(dto);
    return this.allocationRepository.save(allocation);
  }

  async updateAllocation(id: string, dto: UpdateAllocationDto): Promise<Allocation> {
    await this.allocationRepository.update(id, dto);
    return this.allocationRepository.findOneOrFail({ where: { id }, relations: ['account'] });
  }

  async deleteAllocation(id: string): Promise<void> {
    await this.allocationRepository.delete(id);
  }

  // === INCOME TRANSFERS ===
  async findAllIncomeTransfers(): Promise<IncomeTransfer[]> {
    return this.incomeTransferRepository.find({ relations: ['sourceAccount', 'targetAccount'] });
  }

  async createIncomeTransfer(dto: CreateIncomeTransferDto): Promise<IncomeTransfer> {
    const transfer = this.incomeTransferRepository.create(dto);
    return this.incomeTransferRepository.save(transfer);
  }

  async updateIncomeTransfer(id: string, dto: UpdateIncomeTransferDto): Promise<IncomeTransfer> {
    await this.incomeTransferRepository.update(id, dto);
    return this.incomeTransferRepository.findOneOrFail({ where: { id }, relations: ['sourceAccount', 'targetAccount'] });
  }

  async deleteIncomeTransfer(id: string): Promise<void> {
    await this.incomeTransferRepository.delete(id);
  }
}

