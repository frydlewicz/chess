import { AlgebraicGameClient } from 'chess';
import chess from 'chess/src/main.js';

import { GameState } from './game.types.js';

export class Game {
    private client: AlgebraicGameClient;

    reset(): GameState {
        this.client = chess.create({ PGN: true });

        return this.getState();
    }

    move(notation: string): GameState {
        this.client.move(notation);

        return this.getState();
    }

    private getState(): GameState {
        const status = this.client.getStatus();

        return {
            squares: status.board.squares,
            isCheck: status.isCheck,
            isCheckMate: status.isCheckMate,
            isRepetition: status.isRepetition,
            isStalemate: status.isStalemate,
        };
    }
}
