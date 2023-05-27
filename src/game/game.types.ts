export type Col = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Row = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PieceType = '' | 'N' | 'B' | 'R' | 'Q' | 'K';

export enum ESide {
    WHITE = 0,
    BLACK = 1,
}

export interface IPiece {
    type: PieceType;
    side: ESide;
}

export interface ISquare {
    col: Col;
    row: Row;
    piece?: IPiece;
}

export interface IGameState {
    check: boolean;
    checkmate: boolean;
    draw: boolean;
    insufficient: boolean;
    over: boolean;
    repetition: boolean;
    stalemate: boolean;
}
