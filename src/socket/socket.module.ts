import { Module } from '@nestjs/common';

import { SocketGateway } from './socket.gateway.js';

@Module({
    imports: [],
    controllers: [],
    providers: [SocketGateway],
})
export class SocketModule {}
