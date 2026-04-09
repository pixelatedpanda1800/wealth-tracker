import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WealthSnapshot } from './wealth-snapshot.entity';
import { WealthSource } from './wealth-source.entity';
import { CreateWealthSnapshotDto } from './dto/create-wealth-snapshot.dto';
import { CreateWealthSourceDto, UpdateWealthSourceDto } from './dto/wealth-source.dto';

@Injectable()
export class WealthService {
  constructor(
    @InjectRepository(WealthSnapshot)
    private wealthRepository: Repository<WealthSnapshot>,
    @InjectRepository(WealthSource)
    private sourceRepository: Repository<WealthSource>,
  ) {}

  async findAllSnapshots(): Promise<WealthSnapshot[]> {
    const snapshots = await this.wealthRepository.find({
      order: { year: 'ASC' },
    });

    // Sort chronologically: year then month
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return snapshots.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
  }

  async createOrUpdateSnapshot(
    dto: CreateWealthSnapshotDto,
  ): Promise<WealthSnapshot> {
    const existing = await this.wealthRepository.findOne({
      where: { year: dto.year, month: dto.month },
    });

    if (existing) {
      // Update existing
      Object.assign(existing, dto);
      return this.wealthRepository.save(existing);
    }

    // Create new
    const newSnapshot = this.wealthRepository.create(dto);
    return this.wealthRepository.save(newSnapshot);
  }

  async removeSnapshot(id: string): Promise<void> {
    await this.wealthRepository.delete(id);
  }

  async findAllSources(): Promise<WealthSource[]> {
    return this.sourceRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createSource(dto: CreateWealthSourceDto): Promise<WealthSource> {
    const source = this.sourceRepository.create(dto);
    return this.sourceRepository.save(source);
  }

  async removeSource(id: string): Promise<void> {
    await this.sourceRepository.delete(id);
  }

  async updateSource(
    id: string,
    dto: UpdateWealthSourceDto,
  ): Promise<WealthSource> {
    const existing = await this.sourceRepository.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Wealth source ${id} not found`);
    }
    await this.sourceRepository.update(id, dto);
    return this.sourceRepository.findOneBy({ id }) as Promise<WealthSource>;
  }
}
