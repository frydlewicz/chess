import { io } from '/scripts/socket.io.esm.min.js';
import { Chessboard, BORDER_TYPE, COLOR, INPUT_EVENT_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/Chessboard.min.js';
import { Markers, MARKER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/extensions/markers/Markers.min.js';

const socket = io();
let loadedStyles = false;
let board;
let host;
let watcher;
let orientation;
let gameFen;

export function createGame(ai) {
    socket.emit('create', { ai }, (res) => {
        if (res?.status === 'success' && res.roomId) {
            location.href = `/game/host/${res.roomId}`;
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}

export function joinGame(_host, ai, roomId) {
    host = _host;
    watcher = false;

    const name = sessionStorage.getItem('name') ||
        prompt('Enter your name') ||
        'Nameless';

    sessionStorage.setItem('name', name);

    socket.emit('join', { host, ai, roomId, name }, (res) => {
        if (res?.status === 'success' && res.duelState && res.gameState && res.gameFen) {
            orientation = getOrientation(res.duelState);
            gameFen = res.gameFen;

            loadStyles().then(() => {
                buildBoard();
                generateListeners();

                if (isMyTurn(res.duelState)) {
                    board.enableMoveInput(eventHandler, orientation);
                }
            });
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}

export function watchGame(roomId) {
    watcher = true;

    socket.emit('watch', { roomId }, (res) => {
        if (res?.status === 'success' && res.duelState && res.gameState && res.gameFen) {
            orientation = COLOR.white;
            gameFen = res.gameFen;

            loadStyles().then(() => {
                buildBoard();
                generateListeners();
            });
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}

function loadStyles() {
    if (loadedStyles) {
        return Promise.resolve();
    }

    return Promise.all([
        loadStyle('https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/chessboard.min.css'),
        loadStyle('https://shaack.com/projekte/cm-chessboard/assets/extensions/markers/markers.css'),
    ]).then(() => {
        loadedStyles = true;
    });
}

function loadStyle(href) {
    return new Promise((res) => {
        const link = document.createElement('link');

        link.onload = () => {
            res();
        };
        link.rel = 'stylesheet';
        link.href = href;

        document.head.appendChild(link);
    });
}

function buildBoard() {
    board = new Chessboard(document.getElementById('board'), {
        orientation,
        position: gameFen,
        assetsUrl: 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/',
        style: {
            cssClass: 'chess-club',
            borderType: BORDER_TYPE.frame,
            pieces: {
                file: 'staunty.svg',
            },
            animationDuration: 400,
        },
        extensions: [
            {
                class: Markers,
                props: {
                    autoMarkers: MARKER_TYPE.square,
                },
            },
        ],
    });
}

function isMyTurn(duelState) {
    if (host && duelState.host.turn || !host && duelState.guest.turn) {
        return true;
    }

    return false;
}

function getOrientation(duelState) {
    return host && duelState.host.side === 0 || !host && duelState.guest.side === 0
        ? COLOR.white
        : COLOR.black;
}

function eventHandler(event) {
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        return true;
    } else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        board.disableMoveInput();

        socket.emit('move', {
            move: {
                from: event.squareFrom,
                to: event.squareTo,
            },
        }, (res) => {
            if (res?.status === 'success') {
                return;
            }

            board.setPosition(gameFen);
            board.enableMoveInput(eventHandler, orientation);

            if (res?.status === 'error' && res.display) {
                if (res.reason !== 'ILLEGAL_MOVE') {
                    alert(res.display);
                }
            } else {
                alert('Unknown error!');
            }
        });

        return true;
    }
}

function generateListeners() {
    socket.on('reset', (res) => {
        if (!res?.duelState || !res.gameFen) {
            return;
        }

        orientation = getOrientation(res.duelState);
        gameFen = res.gameFen;

        buildBoard();

        if (!watcher && isMyTurn(res.duelState)) {
            board.enableMoveInput(eventHandler, orientation);
        }
    });

    socket.on('move', (res) => {
        if (!res?.move || !res.duelState || !res.gameState || !res.gameFen) {
            return;
        }

        if (watcher || host !== res.host) {
            board.movePiece(res.move.from, res.move.to, true);
        }

        gameFen = res.gameFen;

        if (!watcher && isMyTurn(res.duelState)) {
            board.enableMoveInput(eventHandler, orientation);
        }
    });
}
