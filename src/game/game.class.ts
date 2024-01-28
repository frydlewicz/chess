import { Chess, Color, PieceSymbol, Square } from 'chess.js';

import { ESide, IGameState, IMove } from './game.types';

export class Game {
    static readonly SidesCount = 2;

    static readonly Pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
    static readonly PiecesCount = Game.Pieces.length;

    static readonly ColStart = 'a';
    static readonly ColEnd = 'h';
    static readonly ColsCount = Game.ColEnd.charCodeAt(0) - Game.ColStart.charCodeAt(0) + 1;

    static readonly RowStart = 1;
    static readonly RowEnd = 8;
    static readonly RowsCount = Game.RowEnd - Game.RowStart + 1;

    static readonly BoardSize = Game.ColsCount * Game.RowsCount;
    private chess: Chess;

    reset(): void {
        this.chess = new Chess();
    }

    move(notation: IMove): void {
        this.chess.move(notation);
    }

    getGameState(): IGameState {
        return {
            check: this.chess.isCheck(),
            checkmate: this.chess.isCheckmate(),
            draw: this.chess.isDraw(),
            insufficient: this.chess.isInsufficientMaterial(),
            over: this.chess.isGameOver(),
            repetition: this.chess.isThreefoldRepetition(),
            stalemate: this.chess.isStalemate(),
        };
    }

    getGameFen(): string {
        return this.chess.fen();
    }

    getTrainInput(side: ESide): number[] {
        const result = new Array(Game.BoardSize * Game.PiecesCount * Game.SidesCount + 1).fill(0);

        result[result.length - 1] = side;

        this.chess.board().forEach((array) =>
            array.forEach((elem) => {
                if (elem) {
                    result[this.boardElemToInputIndex(elem)] = 1;
                }
            }),
        );

        return result;
    }

    static indexToSquare(index: number): Square {
        const col = String.fromCharCode(Game.ColStart.charCodeAt(0) + Math.floor(index / Game.ColsCount));
        const row = (index % Game.RowsCount).toString();

        return `${col}${row}` as Square;
    }

    private boardElemToInputIndex(elem: { square: Square; type: PieceSymbol; color: Color }): number {
        const [col, row] = this.squareToPosition(elem.square);
        const piece = Game.Pieces.indexOf(elem.type);
        const side: ESide = elem.color === 'w' ? ESide.WHITE : ESide.BLACK;

        return (
            col * Game.RowsCount * Game.PiecesCount * Game.SidesCount +
            row * Game.PiecesCount * Game.SidesCount +
            piece * Game.SidesCount +
            side
        );
    }

    private squareToPosition(square: Square): [number, number] {
        const col = square[0];
        const row = square[1];

        return [col.charCodeAt(0) - Game.ColStart.charCodeAt(0), parseInt(row) - Game.RowStart];
    }
}
