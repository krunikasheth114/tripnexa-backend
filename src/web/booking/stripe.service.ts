import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

// InstanceType<typeof Stripe> is the correct way to type a Stripe client instance in v16+
type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeService {
  private readonly client: StripeClient;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  /**
   * Creates a Stripe PaymentIntent.
   * amount is in INR full rupees — converted to paise internally.
   */
  async createPaymentIntent(
    amount: number,
    bookingNumber: string,
    metadata: Record<string, string>,
  ) {
    this.logger.log(
      `Creating PaymentIntent | bookingNumber=${bookingNumber} | amount=₹${amount}`,
    );

    return this.client.paymentIntents.create(
      {
        amount: Math.round(amount * 100), // rupees → paise
        currency: 'inr',
        metadata,
        automatic_payment_methods: { enabled: true },
      },
      {
        idempotencyKey: `booking_${bookingNumber}`,
      },
    );
  }

  /**
   * Validates the Stripe webhook signature and returns the parsed event.
   * Throws if signature is invalid.
   */
  constructWebhookEvent(payload: Buffer, signature: string) {
    return this.client.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    );
  }
}
