import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { BookingService } from './booking.service';

@Controller('web/stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger('StripeWebhook');

  constructor(
    private readonly stripeService: StripeService,
    private readonly bookingService: BookingService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    // ── 1. Validate webhook signature ──────────────────────────
    if (!sig) {
      this.logger.error('Webhook received WITHOUT stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      this.logger.error('req.rawBody is undefined — ensure rawBody: true is set in NestFactory.create()');
      throw new BadRequestException('Raw body not available');
    }

    let event: ReturnType<typeof this.stripeService.constructWebhookEvent>;

    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, sig);
    } catch (err) {
      this.logger.error(
        `Webhook signature verification FAILED | error=${(err as Error).message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    // ── 2. Log every incoming event ────────────────────────────
    this.logger.log(
      `Webhook received | eventType=${event.type} | eventId=${event.id}`,
    );

    // ── 3. Route to handler ────────────────────────────────────
    try {
      switch (event.type) {

        // ✅ Payment succeeded
        case 'payment_intent.succeeded': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pi = event.data.object as any;
          const bookingId = Number(pi.metadata?.bookingId);

          this.logger.log(
            `[SUCCEEDED] PaymentIntent | piId=${pi.id} | bookingId=${bookingId} | amount=₹${pi.amount / 100} | status=${pi.status}`,
          );

          if (!bookingId) {
            this.logger.warn(`[SUCCEEDED] No bookingId in metadata | piId=${pi.id}`);
            break;
          }

          await this.bookingService.confirmBooking(bookingId, pi.id, pi.amount / 100);
          break;
        }

        // ❌ Payment failed
        case 'payment_intent.payment_failed': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pi = event.data.object as any;
          const bookingId = Number(pi.metadata?.bookingId);
          const failureReason = pi.last_payment_error?.message ?? 'Unknown reason';

          this.logger.warn(
            `[FAILED] PaymentIntent | piId=${pi.id} | bookingId=${bookingId} | reason="${failureReason}" | status=${pi.status}`,
          );

          if (!bookingId) {
            this.logger.warn(`[FAILED] No bookingId in metadata | piId=${pi.id}`);
            break;
          }

          await this.bookingService.failBooking(bookingId, pi.id);
          break;
        }

        // 🔄 Requires additional auth (3D Secure)
        case 'payment_intent.requires_action': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pi = event.data.object as any;
          const bookingId = Number(pi.metadata?.bookingId);

          this.logger.warn(
            `[REQUIRES_ACTION] PaymentIntent | piId=${pi.id} | bookingId=${bookingId} | nextAction=${pi.next_action?.type ?? 'unknown'}`,
          );
          break;
        }

        // 🔄 PaymentIntent created
        case 'payment_intent.created': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pi = event.data.object as any;
          const bookingId = pi.metadata?.bookingId ?? 'N/A';

          this.logger.log(
            `[CREATED] PaymentIntent | piId=${pi.id} | bookingId=${bookingId} | amount=₹${pi.amount / 100}`,
          );
          break;
        }

        // 💰 Charge succeeded
        case 'charge.succeeded': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const charge = event.data.object as any;
          this.logger.log(
            `[CHARGE_SUCCEEDED] chargeId=${charge.id} | amount=₹${charge.amount / 100} | method=${charge.payment_method_details?.type ?? 'unknown'}`,
          );
          break;
        }

        // 💸 Refund processed
        case 'charge.refunded': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const charge = event.data.object as any;
          const bookingId = Number(charge.metadata?.bookingId);

          this.logger.warn(
            `[REFUNDED] chargeId=${charge.id} | bookingId=${bookingId} | refundedAmount=₹${charge.amount_refunded / 100}`,
          );

          if (!bookingId) {
            this.logger.warn(`[REFUNDED] No bookingId in metadata | chargeId=${charge.id}`);
            break;
          }

          await this.bookingService.refundBooking(bookingId);
          break;
        }

        // 🚫 Dispute opened
        case 'charge.dispute.created': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dispute = event.data.object as any;
          this.logger.error(
            `[DISPUTE] Dispute opened | disputeId=${dispute.id} | chargeId=${dispute.charge} | amount=₹${dispute.amount / 100} | reason=${dispute.reason}`,
          );
          break;
        }

        // All other events — log only
        default: {
          this.logger.debug(
            `[UNHANDLED] eventType=${event.type} | eventId=${event.id}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Error processing webhook | eventType=${event.type} | eventId=${event.id} | error=${(err as Error).message}`,
        (err as Error).stack,
      );
      // Always return 200 — Stripe retries on 5xx which causes duplicate processing
    }

    return { received: true };
  }
}
