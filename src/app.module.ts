import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { SocketModule } from './socket/socket.module';

@Module({
    imports: [SocketModule],
    providers: [AppService],
    controllers: [AppController],
})
export class AppModule {}
