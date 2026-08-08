import { getConfig, escapeText } from '../config.js';

export function initLogin() {
    return new Promise(function (resolve) {
        const config = getConfig();
        const profile = config.profile || {};
        const userName = profile.displayName || 'rezi';

        const loginScreen = document.createElement('div');
        loginScreen.id = 'login-screen';

        loginScreen.innerHTML = `
            <div class="login-window">
                <div class="login-header">
                    <div class="login-title-text">Logon</div>
                    <div class="login-controls">
                        <button aria-label="Close">✕</button>
                    </div>
                </div>

                <div class="login-body">
                    <div class="login-banner">
                        <div class="login-banner-text"><b>waifuOS</b> 98 SE</div>
                    </div>

                    <div class="login-content">
                        <div class="login-icon-area">
                            <img src="pfp.png" alt="User">
                        </div>
                        <div class="login-inputs">
                            <div class="login-row">
                                <label>Username:</label>
                                <input type="text" value="${escapeText(userName)}" id="login-user" readonly>
                            </div>
                            <div class="login-row">
                                <label>Password:</label>
                                <input type="password" id="login-pass" autofocus placeholder="Press OK to continue">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="login-footer">
                    <button class="login-btn" id="btn-login-ok">OK</button>
                    <button class="login-btn" id="btn-login-cancel">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(loginScreen);

        const inputPass = document.getElementById('login-pass');
        const okButton = document.getElementById('btn-login-ok');

        setTimeout(function () { inputPass.focus(); }, 100);

        const startFadeOut = function (durationInSeconds) {
            const windowElement = loginScreen.querySelector('.login-window');
            loginScreen.style.transition = 'all ' + durationInSeconds + 's ease-in-out';
            if (windowElement) windowElement.style.transition = 'all ' + durationInSeconds + 's ease-in-out';

            requestAnimationFrame(function () {
                loginScreen.style.opacity = '0';
                loginScreen.style.backdropFilter = 'blur(0px)';
                if (windowElement) {
                    windowElement.style.transform = 'scale(1.15)';
                    windowElement.style.filter = 'blur(4px)';
                }
            });

            setTimeout(function () {
                loginScreen.remove();
                resolve();
            }, durationInSeconds * 1000);
        };

        const doLogin = function () {
            if (inputPass.disabled) return;
            inputPass.disabled = true;
            okButton.disabled = true;

            const audio = new Audio('sounds/login.mp3');

            const playAndFade = function () {
                audio.volume = 0.5;
                audio.play().catch(function () {});
                const fadeTime = (audio.duration && isFinite(audio.duration)) ? audio.duration : 2;
                startFadeOut(fadeTime);
            };

            audio.addEventListener('loadedmetadata', playAndFade, { once: true });

            audio.onerror = function () {
                const bootAudio = new Audio('sounds/boot.mp3');
                bootAudio.volume = 0.5;
                bootAudio.play().catch(function () {});
                startFadeOut(0.8);
            };
        };

        okButton.addEventListener('click', doLogin);

        inputPass.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') doLogin();
        });

        document.getElementById('btn-login-cancel').onclick = function () {
            inputPass.value = '';
            inputPass.focus();
        };

        document.querySelector('.login-controls button').onclick = function () {
            inputPass.value = '';
        };
    });
}
