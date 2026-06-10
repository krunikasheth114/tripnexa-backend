import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './common/setup-app';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
        // rawBody: true makes NestJS store the raw Buffer on req.rawBody
        // This is required for Stripe webhook signature verification
        rawBody: true,
    });

    app.enableCors({
        origin: true,
        credentials: true,
    });

    setupApp(app);
    await app.listen(process.env.PORT || 5000);
}
bootstrap();
