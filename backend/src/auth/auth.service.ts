import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { WorkerProfile } from './entities/worker-profile.entity';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkerProfile)
    private readonly workerProfileRepository: Repository<WorkerProfile>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: User }> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone ?? null,
      role: dto.role,
    });
    const saved = await this.userRepository.save(user);

    if (dto.role === UserRole.WORKER) {
      const profile = this.workerProfileRepository.create({ userId: saved.id });
      await this.workerProfileRepository.save(profile);
    }

    const accessToken = this.generateToken(saved);
    return { accessToken, user: saved };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const accessToken = this.generateToken(user);
    return { accessToken, user };
  }

  async getMe(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { workerProfile: true },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async updateMe(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.fcmToken !== undefined) user.fcmToken = dto.fcmToken;

    const saved = await this.userRepository.save(user);
    return saved;
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
