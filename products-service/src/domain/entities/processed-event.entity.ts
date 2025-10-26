import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ProcessingResult } from '../shared/enums/processing-result.enum';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  eventId: string;

  @Column()
  eventType: string;

  @Column('jsonb')
  eventData: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ProcessingResult,
    default: ProcessingResult.SUCCESS,
  })
  processingResult: ProcessingResult;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
