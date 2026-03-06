import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type OutgoingType = 'non-negotiable' | 'required' | 'optional' | 'savings';
export type Frequency = 'monthly' | 'annual';

@Entity('outgoing_sources')
export class OutgoingSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: OutgoingType;

  @Column({ type: 'varchar', length: 10 })
  frequency: Frequency;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'int', nullable: true })
  paymentDate: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  wealthSourceId: string | null;
}
