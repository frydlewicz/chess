import { io } from '/scripts/socket.io.esm.min.js';
import { Chessboard, BORDER_TYPE, COLOR, INPUT_EVENT_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7.7.1/src/Chessboard.min.js';
import { Markers, MARKER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7.7.1/src/extensions/markers/Markers.min.js';

const socket = io();
let loadedStyles = false;
let board;
let host;
let watcher;
let orientation;
let gameFen;
let net;

export function createGame(ai) {
    socket.emit('create', { ai }, (res) => {
        if (res?.status === 'success' && res.roomId) {
            location.href = `/game/${ai ? 'ai' : 'host'}/${res.roomId}`;
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

            Promise.all([
                generateListeners(),
                loadStyles().then(() => {
                    buildBoard();

                    if (isMyTurn(res.duelState)) {
                        board.enableMoveInput(eventHandler, orientation);
                    }
                    setCaptions(res.duelState);
                }),
                prepareAI(ai),
            ])
                .then(() => {
                    alert('Loading completed.');
                })
                .catch(() => {
                    alert('Loading error!');
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

            Promise.all([
                generateListeners(),
                loadStyles().then(() => {
                    buildBoard();
                    setCaptions(res.duelState);
                }),
            ])
                .then(() => {
                    alert('Loading completed.');
                })
                .catch(() => {
                    alert('Loading error!');
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
        loadStyle('https://cdn.jsdelivr.net/npm/cm-chessboard@7.7.1/assets/chessboard.min.css'),
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

function loadScript(src) {
    return new Promise((res) => {
        const script = document.createElement('script');

        script.onload = () => {
            res();
        };
        script.src = src;

        document.body.appendChild(script);
    });
}

function buildBoard() {
    board = new Chessboard(document.getElementById('board'), {
        orientation,
        position: gameFen,
        assetsUrl: 'https://cdn.jsdelivr.net/npm/cm-chessboard@7.7.1/assets/pieces/',
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

function setCaptions(duelState) {
    document.getElementById('youCaption').innerText = host
        ? `${duelState.host.name ?? ''} (${duelState.host.side === 0 ? 'white' : 'black'})`
        : `${duelState.guest.name ?? ''} (${duelState.guest.side === 0 ? 'white' : 'black'})`;

    document.getElementById('opponentCaption').innerText = duelState.ai
        ? `AI (${duelState.guest.side === 0 ? 'white' : 'black'})`
        : (!host
            ? `${duelState.host.name ?? ''} (${duelState.host.side === 0 ? 'white' : 'black'})`
            : `${duelState.guest.name ?? ''} (${duelState.guest.side === 0 ? 'white' : 'black'})`);
}

function prepareAI(ai) {
    if (!ai) {
        return Promise.resolve();
    }
    return Promise.all([
        loadScript('https://unpkg.com/brain.js@2.0.0-beta.23/dist/browser.js'),
        fetch('/net.json').then((res) => res.json()),
    ])
        .then((array) => {
            net = new brain.NeuralNetwork();

            net.fromJSON(array[1]);
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
    socket.on('join', (res) => {
        if (!res?.duelState) {
            return;
        }

        setCaptions(res.duelState);
    });

    socket.on('reset', (res) => {
        if (!res?.duelState || !res.gameFen) {
            return;
        }

        orientation = getOrientation(res.duelState);
        gameFen = res.gameFen;

        buildBoard();
        setCaptions(res.duelState);

        if (!watcher && isMyTurn(res.duelState)) {
            board.enableMoveInput(eventHandler, orientation);
        }
    });

    socket.on('move', (res) => {
        if (!res?.move || !res.duelState || !res.gameState || !res.gameFen) {
            return;
        }

        if (watcher || host !== res.hostMove || res.aiMove) {
            board.movePiece(res.move.from, res.move.to, true);
        }

        gameFen = res.gameFen;

        if (!watcher && isMyTurn(res.duelState)) {
            board.enableMoveInput(eventHandler, orientation);
        }
    });
}
