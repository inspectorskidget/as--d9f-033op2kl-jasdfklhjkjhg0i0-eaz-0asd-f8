const sounds = {
    click: new Audio('sounds/click.mp3'),
    window: new Audio('sounds/window.mp3'),
    menu: new Audio('sounds/menuDesk.mp3'),
    clippy: new Audio('sounds/clippy.mp3'),
    minimize: new Audio('sounds/minimize.mp3')
};

Object.values(sounds).forEach(function (audio) { audio.volume = 0.5; });

export function playSound(type) {
    const sound = sounds[type];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(function () {});
    }
}
