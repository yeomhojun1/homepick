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

export enum QuoteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  serviceRequestId!: number;

  @Column({ type: 'integer' })
  workerId!: number;

  @Column({ type: 'integer' })
  price!: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours!: number | null;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status!: QuoteStatus;

  @ManyToOne(() => ServiceRequest)
  @JoinColumn({ name: 'serviceRequestId' })
  serviceRequest!: ServiceRequest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'workerId' })
  worker!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
