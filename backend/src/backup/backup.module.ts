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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WealthSnapshot,
            WealthSource,
            IncomeSource,
            OutgoingSource,
            Account,
            Allocation,
        ]),
    ],
    controllers: [BackupController],
    providers: [BackupService],
})
export class BackupModule { }
