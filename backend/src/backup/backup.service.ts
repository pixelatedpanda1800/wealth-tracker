import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
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
        @InjectRepository(InvestmentHolding)
        private investmentHoldingRepo: Repository<InvestmentHolding>,
        @InjectRepository(InvestmentSnapshot)
        private investmentSnapshotRepo: Repository<InvestmentSnapshot>,
        @InjectRepository(Property)
        private propertyRepo: Repository<Property>,
        @InjectRepository(Liability)
        private liabilityRepo: Repository<Liability>,
        @InjectRepository(LiabilitySnapshot)
        private liabilitySnapshotRepo: Repository<LiabilitySnapshot>,
        @InjectRepository(LiabilityOverpayment)
        private liabilityOverpaymentRepo: Repository<LiabilityOverpayment>,
        private dataSource: DataSource,
    ) { }

    async exportFullBackup(): Promise<BackupDataDto> {
        const [
            wealthSources,
            wealthSnapshots,
            incomes,
            outgoings,
            accounts,
            allocations,
            investmentHoldings,
            investmentSnapshots,
            properties,
            liabilities,
            liabilitySnapshots,
            liabilityOverpayments,
        ] = await Promise.all([
            this.wealthSourceRepo.find(),
            this.wealthSnapshotRepo.find(),
            this.incomeRepo.find(),
            this.outgoingRepo.find(),
            this.accountRepo.find(),
            this.allocationRepo.find(),
            this.investmentHoldingRepo.find(),
            this.investmentSnapshotRepo.find(),
            this.propertyRepo.find(),
            this.liabilityRepo.find(),
            this.liabilitySnapshotRepo.find(),
            this.liabilityOverpaymentRepo.find(),
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
                investments: {
                    holdings: investmentHoldings,
                    snapshots: investmentSnapshots,
                },
                liabilities: {
                    properties,
                    liabilities,
                    snapshots: liabilitySnapshots,
                    overpayments: liabilityOverpayments,
                },
            },
        };
    }

    private getRevertFilePath(): string {
        return path.join(process.cwd(), '.backup-revert.json');
    }

    private async clearAllData(manager: EntityManager): Promise<void> {
        // Reverse order of dependencies (children before parents)
        await manager.createQueryBuilder().delete().from(LiabilityOverpayment).execute();
        await manager.createQueryBuilder().delete().from(LiabilitySnapshot).execute();
        await manager.createQueryBuilder().delete().from(Liability).execute();
        await manager.createQueryBuilder().delete().from(Property).execute();
        await manager.createQueryBuilder().delete().from(InvestmentSnapshot).execute();
        await manager.createQueryBuilder().delete().from(InvestmentHolding).execute();
        await manager.createQueryBuilder().delete().from(Allocation).execute();
        await manager.createQueryBuilder().delete().from(Account).execute();
        await manager.createQueryBuilder().delete().from(OutgoingSource).execute();
        await manager.createQueryBuilder().delete().from(IncomeSource).execute();
        await manager.createQueryBuilder().delete().from(WealthSnapshot).execute();
        await manager.createQueryBuilder().delete().from(WealthSource).execute();
    }

    private async insertBackupData(backup: BackupDataDto, manager: EntityManager): Promise<void> {
        const { wealth, budget } = backup.data;

        for (const source of wealth.sources) {
            await manager.save(WealthSource, source);
        }
        for (const snapshot of wealth.snapshots) {
            await manager.save(WealthSnapshot, snapshot);
        }
        if (budget?.incomes) {
            for (const income of budget.incomes) {
                await manager.save(IncomeSource, income);
            }
        }
        if (budget?.outgoings) {
            for (const outgoing of budget.outgoings) {
                await manager.save(OutgoingSource, outgoing);
            }
        }
        if (budget?.accounts) {
            for (const account of budget.accounts) {
                await manager.save(Account, account);
            }
        }
        if (budget?.allocations) {
            for (const allocation of budget.allocations) {
                await manager.save(Allocation, allocation);
            }
        }
        const investments = backup.data.investments;
        if (investments?.holdings) {
            for (const holding of investments.holdings) {
                await manager.save(InvestmentHolding, holding);
            }
        }
        if (investments?.snapshots) {
            for (const snapshot of investments.snapshots) {
                await manager.save(InvestmentSnapshot, snapshot);
            }
        }
        const liabilitiesData = (backup.data as any).liabilities;
        if (liabilitiesData?.properties) {
            for (const property of liabilitiesData.properties) {
                await manager.save(Property, property);
            }
        }
        if (liabilitiesData?.liabilities) {
            for (const liability of liabilitiesData.liabilities) {
                await manager.save(Liability, liability);
            }
        }
        if (liabilitiesData?.snapshots) {
            for (const snapshot of liabilitiesData.snapshots) {
                await manager.save(LiabilitySnapshot, snapshot);
            }
        }
        if (liabilitiesData?.overpayments) {
            for (const overpayment of liabilitiesData.overpayments) {
                await manager.save(LiabilityOverpayment, overpayment);
            }
        }
    }

    async importFullBackup(backup: BackupDataDto): Promise<{
        success: boolean;
        message: string;
        stats: any;
    }> {
        if (!backup.data || !backup.version) {
            throw new BadRequestException('Invalid backup format');
        }

        // 1. Snapshot current state to disk before touching the DB
        const currentData = await this.exportFullBackup();
        try {
            await fs.promises.writeFile(this.getRevertFilePath(), JSON.stringify(currentData), 'utf-8');
        } catch (err) {
            throw new InternalServerErrorException(`Failed to write revert snapshot: ${(err as Error).message}`);
        }

        // 2. Clear and re-insert inside a transaction — rolls back automatically on any failure
        await this.dataSource.transaction(async (manager) => {
            await this.clearAllData(manager);
            await this.insertBackupData(backup, manager);
        });

        const { wealth, budget, investments } = backup.data;
        const liabilitiesData = (backup.data as any).liabilities;
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
                investmentHoldings: investments?.holdings?.length || 0,
                investmentSnapshots: investments?.snapshots?.length || 0,
                liabilityProperties: liabilitiesData?.properties?.length || 0,
                liabilities: liabilitiesData?.liabilities?.length || 0,
                liabilitySnapshots: liabilitiesData?.snapshots?.length || 0,
                liabilityOverpayments: liabilitiesData?.overpayments?.length || 0,
            },
        };
    }

    async canRevert(): Promise<boolean> {
        return fs.existsSync(this.getRevertFilePath());
    }

    async revertBackup(): Promise<{ success: boolean; message: string }> {
        const filePath = this.getRevertFilePath();
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('No revert backup found');
        }

        let backupData: BackupDataDto;
        try {
            const rawData = await fs.promises.readFile(filePath, 'utf-8');
            backupData = JSON.parse(rawData);
        } catch (err) {
            throw new InternalServerErrorException(`Failed to read revert snapshot: ${(err as Error).message}`);
        }

        // Revert inside a transaction — rolls back if anything fails
        await this.dataSource.transaction(async (manager) => {
            await this.clearAllData(manager);
            await this.insertBackupData(backupData, manager);
        });

        try {
            await fs.promises.unlink(filePath);
        } catch {
            // Non-fatal: revert succeeded, cleanup of file failed
        }

        return { success: true, message: 'Reverted successfully to previous data.' };
    }
}
