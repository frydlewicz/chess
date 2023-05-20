import { Module } from '@nestjs/common';

import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { SocketModule } from './socket/socket.module.js';

@Module({
    imports: [SocketModule],
    providers: [AppService],
    controllers: [AppController],
})
export class AppModule {}
