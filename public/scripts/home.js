particlesJS('body',
    {
        particles: {
            number: {
                value: 100,
                density: {
                    enable: true,
                    value_area: 1000,
                },
            },
            color: {
                value: '#af6b3f',
            },
            opacity: {
                value: 0.5,
                random: true,
                anim: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.1,
                },
            },
            size: {
                value: 5,
                random: true,
            },
            line_linked: {
                enable: true,
                distance: 200,
                color: '#af6b3f',
                opacity: 0.5,
                width: 1,
            },
            move: {
                enable: true,
                speed: 5,
                random: true,
                out_mode: 'bounce',
            },
        },
    },
);

(() => {
    const joinGameButton = document.querySelector('#joinGame');

    if (joinGameButton) {
        joinGameButton.addEventListener('click', () => {
            const roomId = prompt('Enter room ID:');

            if (roomId) {
                location.href = `/game/guest/${roomId}`;
            }
        });
    }
})();
