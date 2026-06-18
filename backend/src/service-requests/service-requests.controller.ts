import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dtos/create-service-request.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/current-user.decorator';

@ApiTags('service-requests')
@Controller('api/v1/service-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateServiceRequestDto,
  ): Promise<unknown> {
    return this.serviceRequestsService.create(user.sub, dto);
  }

  @Get()
  async findAll(): Promise<unknown> {
    return this.serviceRequestsService.findAll();
  }

  @Get('my')
  async findMy(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.serviceRequestsService.findMy(user.sub);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return this.serviceRequestsService.findOne(id);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.serviceRequestsService.cancel(id, user.sub);
  }
}
