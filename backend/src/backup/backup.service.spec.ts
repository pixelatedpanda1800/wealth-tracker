import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
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
import * as fs from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

const mockRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
    from: jest.fn().mockReturnThis(),
  }),
});

const mockDataSource = {
  transaction: jest.fn(),
};

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: getRepositoryToken(WealthSnapshot), useFactory: mockRepo },
        { provide: getRepositoryToken(WealthSource), useFactory: mockRepo },
        { provide: getRepositoryToken(IncomeSource), useFactory: mockRepo },
        { provide: getRepositoryToken(OutgoingSource), useFactory: mockRepo },
        { provide: getRepositoryToken(Account), useFactory: mockRepo },
        { provide: getRepositoryToken(Allocation), useFactory: mockRepo },
        { provide: getRepositoryToken(InvestmentHolding), useFactory: mockRepo },
        { provide: getRepositoryToken(InvestmentSnapshot), useFactory: mockRepo },
        { provide: getRepositoryToken(Property), useFactory: mockRepo },
        { provide: getRepositoryToken(Liability), useFactory: mockRepo },
        { provide: getRepositoryToken(LiabilitySnapshot), useFactory: mockRepo },
        { provide: getRepositoryToken(LiabilityOverpayment), useFactory: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(BackupService);
    jest.clearAllMocks();
  });

  describe('importFullBackup', () => {
    it('throws BadRequestException when payload is missing data or version', async () => {
      await expect(service.importFullBackup({} as any))
        .rejects.toThrow(BadRequestException);

      await expect(service.importFullBackup({ version: 1 } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('writes a revert snapshot and runs inside a transaction on valid payload', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (mockDataSource.transaction as jest.Mock).mockResolvedValue(undefined);

      const payload = {
        version: 2,
        timestamp: new Date().toISOString(),
        data: {
          wealth: { sources: [], snapshots: [] },
          budget: { incomes: [], outgoings: [], accounts: [], allocations: [] },
          investments: { holdings: [], snapshots: [] },
          liabilities: { properties: [], liabilities: [], snapshots: [], overpayments: [] },
        },
      };

      const result = await service.importFullBackup(payload);

      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('canRevert', () => {
    it('returns false when the revert file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(await service.canRevert()).toBe(false);
    });

    it('returns true when the revert file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      expect(await service.canRevert()).toBe(true);
    });
  });

  describe('revertBackup', () => {
    it('throws NotFoundException when no revert file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await expect(service.revertBackup()).rejects.toThrow(NotFoundException);
    });
  });
});
