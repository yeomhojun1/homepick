import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Quote } from '../../quotes/entities/quote.entity';

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  quoteId!: number;

  @Column({ type: 'integer' })
  serviceRequestId!: number;

  @Column({ type: 'integer' })
  customerId!: number;

  @Column({ type: 'integer' })
  workerId!: number;

  @Column({ type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status!: BookingStatus;

  @ManyToOne(() => Quote)
  @JoinColumn({ name: 'quoteId' })
  quote!: Quote;

  @ManyToOne(() => ServiceRequest)
  @JoinColumn({ name: 'serviceRequestId' })
  serviceRequest!: ServiceRequest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'workerId' })
  worker!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
