import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { genRandomString } from '../helpers/hash.js';
import { IDuel, IResponse } from './socket.types.js';
import { Game } from '../game/game.class.js';
import { GameState } from '../game/game.types.js';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    private readonly server: Server;

    private readonly duels: { [roomId: string]: IDuel<Game> } = {};

    @SubscribeMessage('create')
    create(@ConnectedSocket() socket: Socket, @MessageBody() ai: boolean): IResponse<GameState> {
        const roomId = genRandomString(10);

        this.duels[roomId] = {
            host: {
                socketId: socket.id,
                white: true,
                turn: true,
            },
            guest: {
                white: false,
                turn: false,
            },
            ai,
            game: new Game(),
        };

        const state = this.duels[roomId].game.reset();

        return {
            status: 'success',
            roomId,
            state,
        };
    }

    @SubscribeMessage('join')
    join(@ConnectedSocket() socket: Socket, @MessageBody() roomId: string): IResponse<GameState> {
        if (!this.duels[roomId]) {
            return {
                status: 'error',
                reason: 'ROOM_NOT_FOUND',
                display: 'Incorrect room ID!',
            };
        }

        if (this.duels[roomId].ai) {
            return {
                status: 'error',
                reason: 'DUEL_WITH_AI',
                display: 'Duel with AI only!',
            };
        }

        if (this.duels[roomId].host.socketId === socket.id) {
            return {
                status: 'error',
                reason: 'YOU_ALREADY_JOINED',
                display: 'You already joined!',
            };
        }

        if (this.duels[roomId].guest.socketId) {
            return {
                status: 'error',
                reason: 'SOMEONE_ALREADY_JOINED',
                display: 'Someone else already joined!',
            };
        }

        this.duels[roomId].host.socketId = socket.id;

        const state = this.duels[roomId].game.getState();

        socket.to(roomId).emit('state', state);

        return {
            status: 'success',
            roomId,
        };
    }

    @SubscribeMessage('move')
    move(@ConnectedSocket() socket: Socket, @MessageBody() move: string): IResponse<GameState> {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return {
                status: 'error',
                reason: 'DUEL_NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        if (
            (this.duels[roomId].host.socketId === socket.id && !this.duels[roomId].host.turn) ||
            (this.duels[roomId].guest.socketId === socket.id && !this.duels[roomId].guest.turn)
        ) {
            return {
                status: 'error',
                reason: 'NOT_YOUR_TURN',
                display: 'Not your turn!',
            };
        }

        const state = this.duels[roomId].game.move(move);

        this.duels[roomId].host.turn = !this.duels[roomId].host.turn;
        this.duels[roomId].guest.turn = !this.duels[roomId].guest.turn;

        socket.to(roomId).emit('state', state);

        return {
            status: 'success',
            roomId,
        };
    }

    @SubscribeMessage('reset')
    reset(@ConnectedSocket() socket: Socket, @MessageBody() white: boolean): IResponse<GameState> {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return {
                status: 'error',
                reason: 'DUEL_NOT_FOUND',
                display: 'Duel not found!',
            };
        }

        this.duels[roomId].host.white = white;
        this.duels[roomId].guest.white = !white;

        const state = this.duels[roomId].game.reset();

        socket.to(roomId).emit('state', state);

        return {
            status: 'success',
            roomId,
        };
    }

    handleDisconnect(socket: Socket): void {
        const roomId = this.findRoomId(socket);

        if (!roomId) {
            return;
        }

        if (this.duels[roomId].host.socketId === socket.id) {
            socket.to(roomId).emit('leave');
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
}
