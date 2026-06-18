import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from './entities/service-request.entity';
import { CreateServiceRequestDto } from './dtos/create-service-request.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  async create(
    customerId: number,
    dto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const request = this.serviceRequestRepository.create({
      customerId,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
      address: dto.address,
      imageUrls: dto.imageUrls ?? [],
      preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
      status: ServiceRequestStatus.OPEN,
    });
    return this.serviceRequestRepository.save(request);
  }

  async findAll(): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { status: ServiceRequestStatus.OPEN },
      relations: { customer: true, category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findMy(customerId: number): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { customerId },
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ServiceRequest> {
    const request = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: { customer: true, category: true },
    });
    if (!request) {
      throw new NotFoundException('의뢰를 찾을 수 없습니다.');
    }
    return request;
  }

  async cancel(id: number, userId: number): Promise<ServiceRequest> {
    const request = await this.findOne(id);
    if (request.customerId !== userId) {
      throw new ForbiddenException('취소 권한이 없습니다.');
    }
    if (request.status === ServiceRequestStatus.COMPLETED) {
      throw new ForbiddenException('완료된 의뢰는 취소할 수 없습니다.');
    }
    request.status = ServiceRequestStatus.CANCELLED;
    return this.serviceRequestRepository.save(request);
  }

  async updateStatus(
    id: number,
    status: ServiceRequestStatus,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(id);
    request.status = status;
    return this.serviceRequestRepository.save(request);
  }
}
