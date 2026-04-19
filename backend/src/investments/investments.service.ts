import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentHolding } from './entities/investment-holding.entity';
import { InvestmentSnapshot } from './entities/investment-snapshot.entity';
import { WealthSnapshot } from '../wealth/wealth-snapshot.entity';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { UpdateSnapshotDto } from './dto/update-snapshot.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(InvestmentHolding)
    private holdingRepo: Repository<InvestmentHolding>,
    @InjectRepository(InvestmentSnapshot)
    private snapshotRepo: Repository<InvestmentSnapshot>,
    @InjectRepository(WealthSnapshot)
    private wealthSnapshotRepo: Repository<WealthSnapshot>,
  ) {}

  // --- Holdings ---

  async findAllHoldings(): Promise<InvestmentHolding[]> {
    return this.holdingRepo.find({
      relations: ['wealthSource'],
      order: { createdAt: 'ASC' },
    });
  }

  async createHolding(dto: CreateHoldingDto): Promise<InvestmentHolding> {
    const holding = this.holdingRepo.create(dto);
    return this.holdingRepo.save(holding);
  }

  async updateHolding(id: string, dto: UpdateHoldingDto): Promise<InvestmentHolding> {
    const existing = await this.holdingRepo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Holding ${id} not found`);
    }
    await this.holdingRepo.update(id, dto);
    return this.holdingRepo.findOne({
      where: { id },
      relations: ['wealthSource'],
    }) as Promise<InvestmentHolding>;
  }

  async removeHolding(id: string): Promise<void> {
    const holding = await this.holdingRepo.findOneBy({ id });
    if (!holding) {
      throw new NotFoundException(`Holding ${id} not found`);
    }
    // Get all unique year/month combos for this holding's snapshots before deleting
    const snapshots = await this.snapshotRepo.find({ where: { holdingId: id } });
    const periods = [
      ...new Set(snapshots.map((s) => `${s.year}-${s.month}`)),
    ].map((key) => {
      const [year, month] = key.split('-');
      return { year: Number(year), month };
    });

    await this.holdingRepo.delete(id);

    // Re-roll-up each affected period
    for (const period of periods) {
      await this.rollUpWealthSnapshot(holding.wealthSourceId, period.year, period.month);
    }
  }

  // --- Snapshots ---

  async findAllSnapshots(holdingId?: string): Promise<InvestmentSnapshot[]> {
    const where = holdingId ? { holdingId } : {};
    return this.snapshotRepo.find({
      where,
      relations: ['holding'],
      order: { year: 'ASC' },
    });
  }

  async createOrUpdateSnapshot(dto: CreateSnapshotDto): Promise<InvestmentSnapshot> {
    const holding = await this.holdingRepo.findOneBy({ id: dto.holdingId });
    if (!holding) {
      throw new NotFoundException(`Holding ${dto.holdingId} not found`);
    }

    const existing = await this.snapshotRepo.findOne({
      where: { holdingId: dto.holdingId, year: dto.year, month: dto.month },
    });

    let snapshot: InvestmentSnapshot;
    if (existing) {
      Object.assign(existing, dto);
      snapshot = await this.snapshotRepo.save(existing);
    } else {
      snapshot = this.snapshotRepo.create(dto);
      snapshot = await this.snapshotRepo.save(snapshot);
    }

    // Auto-roll-up to WealthSnapshot
    await this.rollUpWealthSnapshot(holding.wealthSourceId, dto.year, dto.month);

    return snapshot;
  }

  async removeSnapshot(id: string): Promise<void> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { id },
      relations: ['holding'],
    });
    if (!snapshot) {
      throw new NotFoundException(`Snapshot ${id} not found`);
    }

    const { year, month } = snapshot;
    const wealthSourceId = snapshot.holding.wealthSourceId;

    await this.snapshotRepo.delete(id);

    // Re-roll-up after deletion
    await this.rollUpWealthSnapshot(wealthSourceId, year, month);
  }

  // --- Roll-up Logic ---

  private async rollUpWealthSnapshot(
    wealthSourceId: string,
    year: number,
    month: string,
  ): Promise<void> {
    // Get all holdings for this wealth source
    const holdings = await this.holdingRepo.find({
      where: { wealthSourceId },
    });
    const holdingIds = holdings.map((h) => h.id);

    // Sum all snapshot values for these holdings in the given period
    let total = 0;
    if (holdingIds.length > 0) {
      for (const holdingId of holdingIds) {
        const snap = await this.snapshotRepo.findOne({
          where: { holdingId, year, month },
        });
        if (snap) {
          total += Number(snap.value);
        }
      }
    }

    // Find or create the WealthSnapshot for this year/month
    let wealthSnapshot = await this.wealthSnapshotRepo.findOne({
      where: { year, month },
    });

    if (wealthSnapshot) {
      wealthSnapshot.values = {
        ...wealthSnapshot.values,
        [wealthSourceId]: total,
      };
      await this.wealthSnapshotRepo.save(wealthSnapshot);
    } else {
      const newSnapshot = this.wealthSnapshotRepo.create({
        year,
        month,
        values: { [wealthSourceId]: total },
      });
      await this.wealthSnapshotRepo.save(newSnapshot);
    }
  }
}
