import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WealthSnapshot } from '../wealth/wealth-snapshot.entity';
import { WealthSource } from '../wealth/wealth-source.entity';
import { IncomeSource } from '../budget/entities/income-source.entity';
import { OutgoingSource } from '../budget/entities/outgoing-source.entity';
import { Account } from '../budget/entities/account.entity';
import { Allocation } from '../budget/entities/allocation.entity';
import { BackupDataDto } from './dto/backup-data.dto';

@Injectable()
export class BackupService {
    constructor(
        @InjectRepository(WealthSnapshot)
        private wealthSnapshotRepo: Repository<WealthSnapshot>,
        @InjectRepository(WealthSource)
        private wealthSourceRepo: Repository<WealthSource>,
        @InjectRepository(IncomeSource)
        private incomeRepo: Repository<IncomeSource>,
        @InjectRepository(OutgoingSource)
        private outgoingRepo: Repository<OutgoingSource>,
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        @InjectRepository(Allocation)
        private allocationRepo: Repository<Allocation>,
    ) { }

    async exportFullBackup(): Promise<BackupDataDto> {
        const [
            wealthSources,
            wealthSnapshots,
            incomes,
            outgoings,
            accounts,
            allocations
        ] = await Promise.all([
            this.wealthSourceRepo.find(),
            this.wealthSnapshotRepo.find(),
            this.incomeRepo.find(),
            this.outgoingRepo.find(),
            this.accountRepo.find(),
            this.allocationRepo.find(),
        ]);

        return {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                wealth: {
                    sources: wealthSources,
                    snapshots: wealthSnapshots,
                },
                budget: {
                    incomes: incomes,
                    outgoings: outgoings,
                    accounts: accounts,
                    allocations: allocations,
                },
            },
        };
    }

    async importFullBackup(backup: BackupDataDto): Promise<{
        success: boolean;
        message: string;
        stats: any;
    }> {
        if (!backup.data || !backup.version) {
            throw new Error('Invalid backup format');
        }

        const { wealth, budget } = backup.data;

        // Process Wealth Sources
        for (const source of wealth.sources) {
            await this.wealthSourceRepo.save(source);
        }

        // Process Wealth Snapshots
        for (const snapshot of wealth.snapshots) {
            await this.wealthSnapshotRepo.save(snapshot);
        }

        // Process Incomes
        if (budget?.incomes) {
            for (const income of budget.incomes) {
                await this.incomeRepo.save(income);
            }
        }

        // Process Outgoings
        if (budget?.outgoings) {
            for (const outgoing of budget.outgoings) {
                await this.outgoingRepo.save(outgoing);
            }
        }

        // Process Accounts
        if (budget?.accounts) {
            for (const account of budget.accounts) {
                await this.accountRepo.save(account);
            }
        }

        // Process Allocations
        if (budget?.allocations) {
            for (const allocation of budget.allocations) {
                await this.allocationRepo.save(allocation);
            }
        }

        return {
            success: true,
            message: 'Restore completed successfully',
            stats: {
                sources: wealth.sources.length,
                snapshots: wealth.snapshots.length,
                incomes: budget?.incomes?.length || 0,
                outgoings: budget?.outgoings?.length || 0,
                accounts: budget?.accounts?.length || 0,
                allocations: budget?.allocations?.length || 0,
            },
        };
    }
}
