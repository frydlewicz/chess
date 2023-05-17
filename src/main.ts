import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';

import { AppModule } from './app.module';

const port = parseInt(process.env.PORT || '3000');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.setViewEngine('pug');
    app.setBaseViewsDir(resolve('./views/pages'));
    app.disable('x-powered-by');
    await app.listen(port);

    console.info(`Listening on port ${port}.`);
}
bootstrap();
