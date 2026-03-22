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
import * as fs from 'fs';
import * as path from 'path';

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

    private getRevertFilePath(): string {
        return path.join(process.cwd(), '.backup-revert.json');
    }

    private async clearAllData(): Promise<void> {
        // Reverse order of dependencies
        await this.allocationRepo.delete({});
        await this.accountRepo.delete({});
        await this.outgoingRepo.delete({});
        await this.incomeRepo.delete({});
        await this.wealthSnapshotRepo.delete({});
        await this.wealthSourceRepo.delete({});
    }

    private async insertBackupData(backup: BackupDataDto): Promise<void> {
        const { wealth, budget } = backup.data;

        for (const source of wealth.sources) {
            await this.wealthSourceRepo.save(source);
        }
        for (const snapshot of wealth.snapshots) {
            await this.wealthSnapshotRepo.save(snapshot);
        }
        if (budget?.incomes) {
            for (const income of budget.incomes) {
                await this.incomeRepo.save(income);
            }
        }
        if (budget?.outgoings) {
            for (const outgoing of budget.outgoings) {
                await this.outgoingRepo.save(outgoing);
            }
        }
        if (budget?.accounts) {
            for (const account of budget.accounts) {
                await this.accountRepo.save(account);
            }
        }
        if (budget?.allocations) {
            for (const allocation of budget.allocations) {
                await this.allocationRepo.save(allocation);
            }
        }
    }

    async importFullBackup(backup: BackupDataDto): Promise<{
        success: boolean;
        message: string;
        stats: any;
    }> {
        if (!backup.data || !backup.version) {
            throw new Error('Invalid backup format');
        }

        // 1. Export current state and save it
        const currentData = await this.exportFullBackup();
        await fs.promises.writeFile(this.getRevertFilePath(), JSON.stringify(currentData), 'utf-8');

        // 2. Clear Database
        await this.clearAllData();

        // 3. Insert new data
        await this.insertBackupData(backup);

        const { wealth, budget } = backup.data;
        return {
            success: true,
            message: 'Restore completed successfully. Previous data saved for revert if needed.',
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

    async canRevert(): Promise<boolean> {
        return fs.existsSync(this.getRevertFilePath());
    }

    async revertBackup(): Promise<{ success: boolean; message: string }> {
        const filePath = this.getRevertFilePath();
        if (!fs.existsSync(filePath)) {
            throw new Error('No revert backup found');
        }

        const rawData = await fs.promises.readFile(filePath, 'utf-8');
        const backupData: BackupDataDto = JSON.parse(rawData);

        await this.clearAllData();
        await this.insertBackupData(backupData);

        // Delete the revert file so you can only revert once
        await fs.promises.unlink(filePath);

        return { success: true, message: 'Reverted successfully to previous data.' };
    }
}
