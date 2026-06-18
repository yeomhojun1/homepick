import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { QuotesModule } from './quotes/quotes.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: true,
        logging: configService.get<string>('nodeEnv') !== 'production',
      }),
    }),
    AuthModule,
    CategoriesModule,
    ServiceRequestsModule,
    QuotesModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
