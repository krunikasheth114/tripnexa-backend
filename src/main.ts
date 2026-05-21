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
        origin: [`http://localhost:3000`, `http://localhost:5173`, `http://localhost:5173/`],
        methods: `GET,HEAD,PUT,PATCH,POST,DELETE`,
        credentials: true,
    });

    setupApp(app);
    await app.listen(5000);
}
bootstrap();
