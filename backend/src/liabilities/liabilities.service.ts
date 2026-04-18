import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { Liability } from './entities/liability.entity';
import { LiabilitySnapshot } from './entities/liability-snapshot.entity';
import { LiabilityOverpayment } from './entities/liability-overpayment.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { CreateOverpaymentDto, BulkUpsertOverpaymentsDto } from './dto/create-overpayment.dto';

@Injectable()
export class LiabilitiesService {
  constructor(
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
    @InjectRepository(Liability)
    private liabilityRepo: Repository<Liability>,
    @InjectRepository(LiabilitySnapshot)
    private snapshotRepo: Repository<LiabilitySnapshot>,
    @InjectRepository(LiabilityOverpayment)
    private overpaymentRepo: Repository<LiabilityOverpayment>,
  ) {}

  // --- Properties ---

  async findAllProperties(): Promise<Property[]> {
    return this.propertyRepo.find({ order: { createdAt: 'ASC' } });
  }

  async createProperty(dto: CreatePropertyDto): Promise<Property> {
    const property = this.propertyRepo.create(dto);
    return this.propertyRepo.save(property);
  }

  async updateProperty(id: string, dto: UpdatePropertyDto): Promise<Property> {
    const existing = await this.propertyRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Property ${id} not found`);
    await this.propertyRepo.update(id, dto);
    return this.propertyRepo.findOneBy({ id }) as Promise<Property>;
  }

  async removeProperty(id: string): Promise<void> {
    const existing = await this.propertyRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Property ${id} not found`);
    await this.propertyRepo.delete(id);
  }

  // --- Liabilities ---

  async findAllLiabilities(): Promise<Liability[]> {
    return this.liabilityRepo.find({
      relations: ['property'],
      order: { createdAt: 'ASC' },
    });
  }

  async createLiability(dto: CreateLiabilityDto): Promise<Liability> {
    const liability = this.liabilityRepo.create(dto);
    return this.liabilityRepo.save(liability);
  }

  async updateLiability(id: string, dto: UpdateLiabilityDto): Promise<Liability> {
    const existing = await this.liabilityRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Liability ${id} not found`);
    await this.liabilityRepo.update(id, dto);
    return this.liabilityRepo.findOne({
      where: { id },
      relations: ['property'],
    }) as Promise<Liability>;
  }

  async archiveLiability(id: string): Promise<Liability> {
    const existing = await this.liabilityRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Liability ${id} not found`);
    await this.liabilityRepo.update(id, { archivedAt: new Date() });
    return this.liabilityRepo.findOne({
      where: { id },
      relations: ['property'],
    }) as Promise<Liability>;
  }

  async removeLiability(id: string): Promise<void> {
    const existing = await this.liabilityRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Liability ${id} not found`);
    await this.liabilityRepo.delete(id);
  }

  // --- Snapshots ---

  async findAllSnapshots(liabilityId?: string): Promise<LiabilitySnapshot[]> {
    const where = liabilityId ? { liabilityId } : {};
    return this.snapshotRepo.find({
      where,
      order: { year: 'ASC', month: 'ASC' },
    });
  }

  async createOrUpdateSnapshot(dto: CreateSnapshotDto): Promise<LiabilitySnapshot> {
    const liability = await this.liabilityRepo.findOneBy({ id: dto.liabilityId });
    if (!liability) throw new NotFoundException(`Liability ${dto.liabilityId} not found`);

    const existing = await this.snapshotRepo.findOne({
      where: { liabilityId: dto.liabilityId, year: dto.year, month: dto.month },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.snapshotRepo.save(existing);
    }

    const snapshot = this.snapshotRepo.create(dto);
    return this.snapshotRepo.save(snapshot);
  }

  async removeSnapshot(id: string): Promise<void> {
    const existing = await this.snapshotRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Snapshot ${id} not found`);
    await this.snapshotRepo.delete(id);
  }

  // --- Overpayments ---

  async findAllOverpayments(liabilityId?: string): Promise<LiabilityOverpayment[]> {
    const where = liabilityId ? { liabilityId } : {};
    return this.overpaymentRepo.find({
      where,
      order: { year: 'ASC', month: 'ASC' },
    });
  }

  async createOrUpdateOverpayment(dto: CreateOverpaymentDto): Promise<LiabilityOverpayment> {
    const liability = await this.liabilityRepo.findOneBy({ id: dto.liabilityId });
    if (!liability) throw new NotFoundException(`Liability ${dto.liabilityId} not found`);

    const existing = await this.overpaymentRepo.findOne({
      where: { liabilityId: dto.liabilityId, year: dto.year, month: dto.month },
    });

    if (existing) {
      existing.amount = dto.amount;
      return this.overpaymentRepo.save(existing);
    }

    const overpayment = this.overpaymentRepo.create(dto);
    return this.overpaymentRepo.save(overpayment);
  }

  async bulkUpsertOverpayments(dto: BulkUpsertOverpaymentsDto): Promise<void> {
    const liability = await this.liabilityRepo.findOneBy({ id: dto.liabilityId });
    if (!liability) throw new NotFoundException(`Liability ${dto.liabilityId} not found`);

    // Update the recurring overpayment on the liability itself if provided
    if (dto.recurringOverpayment !== undefined) {
      await this.liabilityRepo.update(dto.liabilityId, {
        recurringOverpayment: dto.recurringOverpayment,
      });
    }

    // Upsert each per-month override
    for (const op of dto.overpayments) {
      await this.createOrUpdateOverpayment({ ...op, liabilityId: dto.liabilityId });
    }
  }

  async removeOverpayment(id: string): Promise<void> {
    const existing = await this.overpaymentRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException(`Overpayment ${id} not found`);
    await this.overpaymentRepo.delete(id);
  }
}
