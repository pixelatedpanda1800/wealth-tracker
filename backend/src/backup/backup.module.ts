import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { WealthSnapshot } from '../wealth/wealth-snapshot.entity';
import { WealthSource } from '../wealth/wealth-source.entity';
import { IncomeSource } from '../budget/entities/income-source.entity';
import { OutgoingSource } from '../budget/entities/outgoing-source.entity';
import { Account } from '../budget/entities/account.entity';
import { Allocation } from '../budget/entities/allocation.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { InvestmentSnapshot } from '../investments/entities/investment-snapshot.entity';
import { Property } from '../liabilities/entities/property.entity';
import { Liability } from '../liabilities/entities/liability.entity';
import { LiabilitySnapshot } from '../liabilities/entities/liability-snapshot.entity';
import { LiabilityOverpayment } from '../liabilities/entities/liability-overpayment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WealthSnapshot,
            WealthSource,
            IncomeSource,
            OutgoingSource,
            Account,
            Allocation,
            InvestmentHolding,
            InvestmentSnapshot,
            Property,
            Liability,
            LiabilitySnapshot,
            LiabilityOverpayment,
        ]),
    ],
    controllers: [BackupController],
    providers: [BackupService],
})
export class BackupModule { }
