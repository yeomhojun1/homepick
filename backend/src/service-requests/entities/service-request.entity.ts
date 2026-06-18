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
import { Category } from '../../categories/entities/category.entity';

export enum ServiceRequestStatus {
  OPEN = 'open',
  QUOTED = 'quoted',
  BOOKED = 'booked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  customerId!: number;

  @Column({ type: 'integer' })
  categoryId!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 500 })
  address!: string;

  @Column({ type: 'text', array: true, default: [] })
  imageUrls!: string[];

  @Column({ type: 'timestamp', nullable: true })
  preferredDate!: Date | null;

  @Column({
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.OPEN,
  })
  status!: ServiceRequestStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
