import { playSound } from './audioManager.js';

export function initStartMenu() {
    const startButton = document.querySelector('.start-button');
    const startMenu = document.getElementById('start-menu');

    window.toggleStartMenu = function () {
        startMenu.classList.toggle('active');
        startButton.classList.toggle('active');
    };

    startButton.addEventListener('click', function (event) {
        event.stopPropagation();
        playSound('click');
        window.toggleStartMenu();
    });

    startMenu.addEventListener('click', function (event) {
        event.stopPropagation();
    });

    document.addEventListener('click', function () {
        startMenu.classList.remove('active');
        startButton.classList.remove('active');
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Alt') {
            event.preventDefault();
            playSound('click');
            window.toggleStartMenu();
        }
    });
}
