import { ESide, IGameState } from '../game/game.types';
import { Game } from '../game/game.class';

export interface IPlayer {
    name?: string;
    socketId?: string;
    side: ESide;
    turn: boolean;
}

export interface IDuel {
    host: IPlayer;
    guest: IPlayer;
    ai: boolean;
    game: Game;
    startedAt?: Date;
    endedAt?: Date;
}

export interface IDuelState {
    host: IPlayer;
    guest: IPlayer;
    ai: boolean;
    startedAt: Date;
    endedAt: Date;
}

export interface ICorrectResponse {
    status: 'success';
    roomId?: string;
    duelState?: IDuelState;
    gameState?: IGameState;
    gameFen?: string;
}

export interface IErrorResponse {
    status: 'error';
    reason: string;
    display: string;
}

export type IResponse = ICorrectResponse | IErrorResponse;
