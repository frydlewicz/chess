export interface IPlayer {
    socketId?: string;
    white: boolean;
    turn: boolean;
}

export interface IDuel<GameType> {
    host: IPlayer;
    guest: IPlayer;
    ai: boolean;
    game: GameType;
    startedAt?: Date;
    endedAt?: Date;
}

export interface ICorrectResponse<GameStateType> {
    status: 'success';
    roomId: string;
    state?: GameStateType;
}

export interface IErrorResponse {
    status: 'error';
    reason: string;
    display: string;
}

export type IResponse<GameStateType> = ICorrectResponse<GameStateType> | IErrorResponse;
