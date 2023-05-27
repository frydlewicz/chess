import { io } from '/scripts/socket.io.esm.min.js';
import { Chessboard, BORDER_TYPE, COLOR, INPUT_EVENT_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/Chessboard.min.js';
import { Markers, MARKER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/extensions/markers/Markers.min.js';

const socket = io();
let loadedStyle = false;
let board;
let host;
let ai;
let roomId;
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

export function joinGame(_host, _ai, _roomId) {
    host = _host;
    ai = _ai;
    roomId = _roomId;

    const name = sessionStorage.getItem('name') ||
        prompt('Enter your name') ||
        'Nameless';

    sessionStorage.setItem('name', name);

    socket.emit('join', { host, ai, roomId, name }, (res) => {
        if (res?.status === 'success' && res.duelState && res.gameState && res.gameFen) {
            gameFen = res.gameFen;

            loadStyles().then(() => {
                orientation = host && res.duelState.host.side === 0 || !host && res.duelState.guest.side === 0
                    ? COLOR.white
                    : COLOR.black;

                buildBoard(orientation);

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

export function watchGame(_roomId) {
    roomId = _roomId;

    socket.emit('watch', { roomId }, (res) => {
        if (res?.status === 'success' && res.duelState && res.gameState && res.gameFen) {
            gameFen = res.gameFen;

            loadStyles().then(() => {
                buildBoard(COLOR.white);
            });
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}

function loadStyles() {
    return Promise.all([
        loadStyle('https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/chessboard.min.css'),
        loadStyle('https://shaack.com/projekte/cm-chessboard/assets/extensions/markers/markers.css'),
    ]);
}

function loadStyle(href) {
    if (loadedStyle) {
        return Promise.resolve();
    }

    return new Promise((res) => {
        const link = document.createElement('link');

        link.onload = () => {
            loadedStyle = true;
            res();
        };
        link.rel = 'stylesheet';
        link.href = href;

        document.head.appendChild(link);
    });
}

function buildBoard(orientation) {
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
            if (res?.status === 'success' && res.gameFen) {
                return gameFen = res.gameFen;
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
