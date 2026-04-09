import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { WealthService } from './wealth.service';
import { WealthSnapshot } from './wealth-snapshot.entity';
import { WealthSource } from './wealth-source.entity';

const mockSnapshotRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockSourceRepo = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('WealthService', () => {
  let service: WealthService;
  let snapshotRepo: ReturnType<typeof mockSnapshotRepo>;
  let sourceRepo: ReturnType<typeof mockSourceRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WealthService,
        { provide: getRepositoryToken(WealthSnapshot), useFactory: mockSnapshotRepo },
        { provide: getRepositoryToken(WealthSource), useFactory: mockSourceRepo },
      ],
    }).compile();

    service = module.get(WealthService);
    snapshotRepo = module.get(getRepositoryToken(WealthSnapshot));
    sourceRepo = module.get(getRepositoryToken(WealthSource));
  });

  describe('findAllSnapshots', () => {
    it('returns snapshots sorted chronologically', async () => {
      snapshotRepo.find.mockResolvedValue([
        { year: 2024, month: 'Mar' },
        { year: 2024, month: 'Jan' },
        { year: 2023, month: 'Dec' },
        { year: 2024, month: 'Feb' },
      ]);

      const result = await service.findAllSnapshots();

      expect(result.map(s => `${s.year}-${s.month}`)).toEqual([
        '2023-Dec',
        '2024-Jan',
        '2024-Feb',
        '2024-Mar',
      ]);
    });
  });

  describe('createOrUpdateSnapshot', () => {
    it('creates a new snapshot when none exists for that year/month', async () => {
      const dto = { year: 2024, month: 'Jan', values: { cash: 1000 } };
      snapshotRepo.findOne.mockResolvedValue(null);
      snapshotRepo.create.mockReturnValue(dto);
      snapshotRepo.save.mockResolvedValue({ id: 'uuid-1', ...dto });

      const result = await service.createOrUpdateSnapshot(dto);

      expect(snapshotRepo.create).toHaveBeenCalledWith(dto);
      expect(snapshotRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('uuid-1');
    });

    it('updates an existing snapshot when year/month already exists', async () => {
      const existing = { id: 'uuid-1', year: 2024, month: 'Jan', values: { cash: 500 } };
      const dto = { year: 2024, month: 'Jan', values: { cash: 1500 } };
      snapshotRepo.findOne.mockResolvedValue(existing);
      snapshotRepo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.createOrUpdateSnapshot(dto);

      expect(snapshotRepo.create).not.toHaveBeenCalled();
      expect(snapshotRepo.save).toHaveBeenCalledWith({ ...existing, ...dto });
      expect(result.values).toEqual({ cash: 1500 });
    });
  });

  describe('updateSource', () => {
    it('throws NotFoundException when source id does not exist', async () => {
      sourceRepo.findOneBy.mockResolvedValue(null);

      await expect(service.updateSource('missing-id', { name: 'New Name' }))
        .rejects.toThrow(NotFoundException);
    });

    it('updates and returns the source when it exists', async () => {
      const existing = { id: 'src-1', name: 'Old Name', category: 'cash', color: '#fff' };
      sourceRepo.findOneBy
        .mockResolvedValueOnce(existing)       // existence check
        .mockResolvedValueOnce({ ...existing, name: 'New Name' }); // return after update
      sourceRepo.update.mockResolvedValue(undefined);

      const result = await service.updateSource('src-1', { name: 'New Name' });

      expect(sourceRepo.update).toHaveBeenCalledWith('src-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });
  });
});
