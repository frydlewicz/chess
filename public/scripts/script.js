import { io } from '/scripts/socket.io.esm.min.js';
import { Chessboard } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/Chessboard.min.js';
import { FEN } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/src/model/Position.min.js';

const socket = io();
let board;

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
        if (res?.status === 'success') {
            loadStyle().then(() => {
                buildBoard();
            });
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}

function loadStyle() {
    return new Promise((res) => {
        const link = document.createElement('link');

        link.onload = () => res();
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/chessboard.min.css';

        document.head.appendChild(link);
    });
}

function buildBoard() {
    board = new Chessboard(document.getElementById('board'), {
        position: FEN.start,
        assetsUrl: 'https://cdn.jsdelivr.net/npm/cm-chessboard@7/assets/',
        style: {
            pieces: {
                file: 'staunty.svg',
            },
        },
    });
}
