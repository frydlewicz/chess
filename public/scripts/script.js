import { io } from '/scripts/socket.io.esm.min.js';

const socket = io();

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

export function joinGame(host, roomId) {
    const name = sessionStorage.getItem('name') ||
        prompt('Enter your name') ||
        'Nameless';

    sessionStorage.setItem('name', name);

    socket.emit('join', { host, roomId, name }, (res) => {
        if (res?.status === 'success') {
            // TODO
        } else if (res?.status === 'error' && res.display) {
            alert(res.display);
        } else {
            alert('Unknown error!');
        }
    });
}
