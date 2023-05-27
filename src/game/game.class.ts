import { Chess } from 'chess.js';

import { IGameState } from './game.types.js';

export class Game {
    private chess: Chess;

    reset(): void {
        this.chess = new Chess();
    }

    move(notation: string): void {
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
