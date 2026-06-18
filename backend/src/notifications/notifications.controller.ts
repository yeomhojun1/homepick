import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/current-user.decorator';

@ApiTags('notifications')
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.notificationsService.findAll(user.sub);
  }

  @Patch('read-all')
  async readAll(@CurrentUser() user: JwtPayload): Promise<unknown> {
    await this.notificationsService.readAll(user.sub);
    return { message: '알림을 모두 읽음 처리했습니다.' };
  }
}
