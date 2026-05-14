import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './common/setup-app';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    app.enableCors({
        origin: [`http://localhost:3000`, `http://localhost:5173`],
        methods: `GET,HEAD,PUT,PATCH,POST,DELETE`,
        credentials: true,
    });

    setupApp(app);
    await app.listen(5000);
}
bootstrap();
