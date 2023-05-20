import { io } from '/scripts/socket.io.esm.min.js';

const socket = io();

socket.emit('create', { req: 1 }, (res) => {
    console.log(res);
});
