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
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

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

  @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
  balance: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true, transformer: decimalTransformer })
  interestPaid: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true, transformer: decimalTransformer })
  paymentMade: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
