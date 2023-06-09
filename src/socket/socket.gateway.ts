import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { genRandomString } from '../helpers/string';
import { IDuel, IDuelState, IResponse } from './socket.types';
import { ESide, IMove } from '../game/game.types';
import { Game } from '../game/game.class';

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
    create(@MessageBody() body: { ai: boolean }): IResponse {
        const roomId = genRandomString(10);
        const { ai } = body;

        const duel = (this.duels[roomId] = {
            host: {
                side: ESide.WHITE,
                turn: true,
            },
            guest: {
                name: ai ? 'AI' : undefined,
                side: ESide.BLACK,
                turn: false,
            },
            ai,
            game: new Game(),
        });

        duel.game.reset();

        return {
            status: 'success',
            roomId,
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

        const { side } = body;

        duel.game.reset();

        duel.host.side = side;
        duel.guest.side = side === ESide.WHITE ? ESide.BLACK : ESide.WHITE;
        duel.host.turn = side === ESide.WHITE;
        duel.guest.turn = !duel.host.turn;
        duel.startedAt = duel.guest.socketId ? new Date() : undefined;
        duel.endedAt = undefined;

        const duelState = this.getDuelState(duel);
        const gameFen = duel.game.getGameFen();

        setTimeout(() => {
            this.server.to(roomId).emit('reset', { duelState, gameFen });
        }, 1);

        return {
            status: 'success',
        };
    }

    @SubscribeMessage('join')
    join(
        @ConnectedSocket() socket: Socket,
        @MessageBody() body: { host: boolean; ai: boolean; roomId: string; name: string },
    ): IResponse {
        const { host, ai, roomId, name } = body;
        const duel = this.duels[roomId];

        if (!duel) {
            return {
                status: 'error',
                reason: 'NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        if (!ai && duel.ai) {
            return {
                status: 'error',
                reason: 'DUEL_WITH_AI',
                display: 'Duel with AI only!',
            };
        }

        if (ai && !duel.ai) {
            return {
                status: 'error',
                reason: 'DUEL_WITH_PEOPLE',
                display: 'Duel with people only!',
            };
        }

        if (
            (host && duel.host.socketId && duel.host.socketId !== socket.id) ||
            (!host && duel.guest.socketId && duel.guest.socketId !== socket.id)
        ) {
            return {
                status: 'error',
                reason: 'SOMEONE_ALREADY_JOINED',
                display: 'Someone else already joined!',
            };
        }

        if (host) {
            duel.host.socketId = socket.id;
            duel.host.name = name;
        } else {
            duel.guest.socketId = socket.id;
            duel.guest.name = name;
        }

        if (duel.host.socketId && duel.guest.socketId && !duel.startedAt) {
            duel.startedAt = new Date();
        }

        const duelState = this.getDuelState(duel);
        const gameState = duel.game.getGameState();
        const gameFen = duel.game.getGameFen();

        socket.join(roomId);

        setTimeout(() => {
            this.server.to(roomId).emit('join', { duelState });
        }, 1);

        return {
            status: 'success',
            duelState,
            gameState,
            gameFen,
        };
    }

    @SubscribeMessage('watch')
    watch(@ConnectedSocket() socket: Socket, @MessageBody() body: { roomId: string }): IResponse {
        const { roomId } = body;
        const duel = this.duels[roomId];

        if (!duel) {
            return {
                status: 'error',
                reason: 'NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        const duelState = this.getDuelState(duel);
        const gameState = duel.game.getGameState();
        const gameFen = duel.game.getGameFen();

        socket.join(roomId);

        return {
            status: 'success',
            duelState,
            gameState,
            gameFen,
        };
    }

    @SubscribeMessage('move')
    move(@ConnectedSocket() socket: Socket, @MessageBody() body: { move: IMove }): IResponse {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return {
                status: 'error',
                reason: 'DUEL_NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        const duel = this.duels[roomId];
        const host = duel.host.socketId === socket.id;

        if (duel.endedAt) {
            return {
                status: 'error',
                reason: 'GAME_HAS_ENDED',
                display: 'Game has ended!',
            };
        }

        if ((host && !duel.host.turn) || (!host && !duel.guest.turn)) {
            return {
                status: 'error',
                reason: 'NOT_YOUR_TURN',
                display: 'Not your turn!',
            };
        }

        const { move } = body;

        try {
            duel.game.move(move);
        } catch (_) {
            return {
                status: 'error',
                reason: 'ILLEGAL_MOVE',
                display: 'Illegal move!',
            };
        }

        duel.host.turn = !duel.host.turn;
        duel.guest.turn = !duel.guest.turn;

        const duelState = this.getDuelState(duel);
        const gameState = duel.game.getGameState();
        const gameFen = duel.game.getGameFen();

        if (gameState.over && !duel.endedAt) {
            duel.endedAt = new Date();
        }

        setTimeout(() => {
            this.server.to(roomId).emit('move', { host, move, duelState, gameState, gameFen });
        }, 1);

        return {
            status: 'success',
        };
    }

    handleDisconnect(socket: Socket): void {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return;
        }

        const duel = this.duels[roomId];

        if (duel.host.socketId === socket.id) {
            duel.host.socketId = undefined;
        } else {
            duel.guest.socketId = undefined;
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
        };
    }
}
