import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ProcessingResult } from '../shared/enums/processing-result.enum';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true, name: 'event_id' })
  @Index('IDX_PROCESSED_EVENTS_EVENT_ID')
  eventId: string;

  @Column({ length: 100, name: 'event_type' })
  @Index('IDX_PROCESSED_EVENTS_EVENT_TYPE')
  eventType: string;

  @Column({ type: 'jsonb', nullable: true, name: 'event_data' })
  eventData: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: ProcessingResult.SUCCESS,
    name: 'processing_result',
  })
  processingResult: ProcessingResult;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;
}
