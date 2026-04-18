import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Liability } from './liability.entity';

@Entity('liability_snapshots')
@Unique(['liabilityId', 'year', 'month'])
export class LiabilitySnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  liabilityId: string;

  @ManyToOne(() => Liability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'liabilityId' })
  liability: Liability;

  @Column()
  year: number;

  @Column({ length: 3 })
  month: string;

  @Column('decimal', { precision: 12, scale: 2 })
  balance: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  interestPaid: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  paymentMade: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
