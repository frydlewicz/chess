import { AlgebraicGameClient } from 'chess';
import chess from 'chess/src/main.js';

import { ESide, IGameState, ISquare } from './game.types.js';

export class Game {
    private client: AlgebraicGameClient;

    reset(): void {
        this.client = chess.create({ PGN: true });
    }

    move(notation: string): void {
        this.client.move(notation);
    }

    getGameState(): IGameState {
        const status = this.client.getStatus();

        return {
            squares: status.board.squares.map(
                (square) =>
                    ({
                        col: square.file,
                        row: square.rank,
                        piece: square.piece
                            ? {
                                  type: square.piece.notation,
                                  side: square.piece.side?.name !== 'white' ? ESide.BLACK : ESide.WHITE,
                              }
                            : undefined,
                    } as ISquare),
            ),
            isCheck: status.isCheck,
            isCheckMate: status.isCheckMate,
            isRepetition: status.isRepetition,
            isStalemate: status.isStalemate,
        };
    }
}
