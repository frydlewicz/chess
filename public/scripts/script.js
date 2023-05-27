import { io } from '/scripts/socket.io.esm.min.js';
import { Chessboard, BORDER_TYPE, COLOR } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/Chessboard.min.js';
import { FEN } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/model/Position.min.js';

const socket = io();
let board;
let loadedStyle = false;

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

export function joinGame(host, ai, roomId) {
    const name = sessionStorage.getItem('name') ||
        prompt('Enter your name') ||
        'Nameless';

    sessionStorage.setItem('name', name);

    socket.emit('join', { host, ai, roomId, name }, (res) => {
        if (res?.status === 'success' && res.duelState && res.gameState && res.gameFen) {
            loadStyle().then(() => {
                buildBoard(host, res.duelState, res.gameState, res.gameFen);
            });
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}

function loadStyle() {
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
        link.href = 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/chessboard.min.css';

        document.head.appendChild(link);
    });
}

function buildBoard(host, duelState, gameState, gameFen) {
    board = new Chessboard(document.getElementById('board'), {
        orientation: host && duelState.host.side === 0 || !host && duelState.guest.side === 0
            ? COLOR.white
            : COLOR.black,
        position: gameFen,
        assetsUrl: 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/',
        style: {
            cssClass: 'chess-club',
            borderType: BORDER_TYPE.frame,
            pieces: {
                file: 'staunty.svg',
            },
        },
    });
}
