import * as Chess from 'chess';

export interface GameState {
    squares: Chess.Square[];
    isCheck: boolean;
    isCheckMate: boolean;
    isRepetition: boolean;
    isStalemate: boolean;
}
