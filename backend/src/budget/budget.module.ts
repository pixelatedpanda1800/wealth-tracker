import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { IncomeSource } from './entities/income-source.entity';
import { OutgoingSource } from './entities/outgoing-source.entity';
import { Account } from './entities/account.entity';
import { Allocation } from './entities/allocation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IncomeSource, OutgoingSource, Account, Allocation])],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule { }

