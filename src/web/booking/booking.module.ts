import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JWT_SECRET } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [BookingController, StripeWebhookController],
  providers: [BookingService, StripeService],
})
export class BookingModule {}
