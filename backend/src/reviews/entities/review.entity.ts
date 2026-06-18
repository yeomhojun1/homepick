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
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  bookingId!: number;

  @Column({ type: 'integer' })
  reviewerId!: number;

  @Column({ type: 'integer' })
  targetId!: number;

  @Column({ type: 'integer' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerId' })
  reviewer!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'targetId' })
  target!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
