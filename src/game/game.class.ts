import { Chess } from 'chess.js';

import { IGameState, IMove } from './game.types';

export class Game {
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
}
