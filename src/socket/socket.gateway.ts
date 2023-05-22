import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { genRandomString } from '../helpers/string.js';
import { IDuel, IDuelState, IResponse } from './socket.types.js';
import { ESide } from '../game/game.types.js';
import { Game } from '../game/game.class.js';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketGateway implements OnGatewayDisconnect {
    public static readonly GarbageCollectorInterval = 1000 * 60 * 60;
    public static readonly MaxDuelLifetime = 1000 * 60 * 60 * 12;
    private readonly duels: { [roomId: string]: IDuel } = {};

    @WebSocketServer()
    private readonly server: Server;

    constructor() {
        setInterval(() => {
            const past = Date.now() - SocketGateway.MaxDuelLifetime;

            for (const roomId in this.duels) {
                if (this.duels[roomId]?.startedAt && this.duels[roomId].startedAt.getTime() < past) {
                    this.server.to(roomId).emit('leave');

                    delete this.duels[roomId];
                }
            }
        }, SocketGateway.GarbageCollectorInterval);
    }

    @SubscribeMessage('create')
    create(@ConnectedSocket() socket: Socket, @MessageBody() body: { name: string; ai: boolean }): IResponse {
        const roomId = genRandomString(10);
        const duel = (this.duels[roomId] = {
            host: {
                name: body.name,
                socketId: socket.id,
                side: ESide.WHITE,
                turn: true,
            },
            guest: {
                name: body.ai ? 'AI' : undefined,
                side: ESide.BLACK,
                turn: false,
            },
            ai: body.ai,
            game: new Game(),
        });

        duel.game.reset();

        return {
            status: 'success',
            roomId,
            state: this.getDuelState(duel),
        };
    }

    @SubscribeMessage('reset')
    reset(@ConnectedSocket() socket: Socket, @MessageBody() body: { side: ESide }): IResponse {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return {
                status: 'error',
                reason: 'NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        const duel = this.duels[roomId];

        if (duel.host.socketId !== socket.id) {
            return {
                status: 'error',
                reason: 'FORBIDDEN',
                display: 'Only host can reset!',
            };
        }

        duel.game.reset();

        duel.host.side = body.side;
        duel.guest.side = body.side === ESide.WHITE ? ESide.BLACK : ESide.WHITE;
        duel.host.turn = body.side === ESide.WHITE;
        duel.guest.turn = !duel.host.turn;
        duel.startedAt = duel.guest.socketId ? new Date() : undefined;
        duel.endedAt = undefined;

        this.server.to(roomId).emit('state', this.getDuelState(duel));

        return {
            status: 'success',
        };
    }

    @SubscribeMessage('join')
    join(@ConnectedSocket() socket: Socket, @MessageBody() body: { roomId: string }): IResponse {
        const { roomId } = body;
        const duel = this.duels[roomId];

        if (!duel) {
            return {
                status: 'error',
                reason: 'NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        if (duel.ai) {
            return {
                status: 'error',
                reason: 'DUEL_WITH_AI',
                display: 'Duel with AI only!',
            };
        }

        if (duel.host.socketId === socket.id) {
            return {
                status: 'error',
                reason: 'YOU_ALREADY_JOINED',
                display: 'You have already joined!',
            };
        }

        if (duel.guest.socketId && duel.guest.socketId !== socket.id) {
            return {
                status: 'error',
                reason: 'SOMEONE_ALREADY_JOINED',
                display: 'Someone else already joined!',
            };
        }

        duel.guest.socketId = socket.id;

        if (!duel.startedAt) {
            duel.startedAt = new Date();
        }

        this.server.to(roomId).emit('state', this.getDuelState(duel));

        return {
            status: 'success',
        };
    }

    @SubscribeMessage('move')
    move(@ConnectedSocket() socket: Socket, @MessageBody() body: { move: string }): IResponse {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return {
                status: 'error',
                reason: 'DUEL_NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        const duel = this.duels[roomId];

        if (duel.endedAt) {
            return {
                status: 'error',
                reason: 'GAME_HAS_ENDED',
                display: 'Game has ended!',
            };
        }

        if (
            (duel.host.socketId === socket.id && !duel.host.turn) ||
            (duel.guest.socketId === socket.id && !duel.guest.turn)
        ) {
            return {
                status: 'error',
                reason: 'NOT_YOUR_TURN',
                display: 'Not your turn!',
            };
        }

        duel.game.move(body.move);

        duel.host.turn = !duel.host.turn;
        duel.guest.turn = !duel.guest.turn;

        if (duel.game.getGameState().isCheckMate) {
            duel.endedAt = new Date();
        }

        this.server.to(roomId).emit('state', this.getDuelState(duel));

        return {
            status: 'success',
        };
    }

    handleDisconnect(socket: Socket): void {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return;
        }

        if (this.duels[roomId].host.socketId === socket.id) {
            this.server.to(roomId).emit('leave');

            delete this.duels[roomId];
        } else {
            this.duels[roomId].guest.socketId = undefined;
        }
    }

    private findRoomId(socket: Socket): string {
        if (!socket?.id) {
            return;
        }
        return Object.keys(this.duels).find(
            (roomId) =>
                this.duels[roomId]?.host.socketId === socket.id || this.duels[roomId]?.guest.socketId === socket.id,
        );
    }

    private getDuelState(duel: IDuel): IDuelState {
        return {
            host: duel.host,
            guest: duel.guest,
            ai: duel.ai,
            startedAt: duel.startedAt,
            endedAt: duel.endedAt,
            gameState: duel.game.getGameState(),
        };
    }
}
