/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handle all button presses and test progression
 * @param {number} action 
 */
function testController(action) {
    const id = action.target.id.split('-');

    if (id[0] == 'color') {
        if (id[1] == 'yes') {
            endStage(1);
        } else {
            failStage(1);
        }
    } else if (id[0] == 'width') {
        if (id[1] == 'yes') {
            endStage(2);
        } else {
            failStage(2);
        }
    } else {
        if (id[1] == 'yes') {
            failStage(3);
        } else {
            endStage(3);
        }
    }
}

/**
 * Successfully end a stage of the test
 * @param {number} stage 
 */
async function endStage(stage) {
    switch (stage) {
        case 0: // Test scrollbar colors
            UI.button.color.yes.addEventListener('click', testController);
            UI.button.color.no.addEventListener('click', testController);
            document.getElementById('preview-css').textContent = generateCSS('default', 'blue', 'red', 0);
            break;

        case 1: // Test scrollbar width
            document.getElementById('color-test').classList.remove('show');
            document.getElementById('color-heading').classList.add('success');
            document.getElementById('width-test').classList.add('show');

            UI.button.color.yes.removeEventListener('click', testController);
            UI.button.color.no.removeEventListener('click', testController);
            UI.button.width.yes.addEventListener('click', testController);
            UI.button.width.no.addEventListener('click', testController);

            document.getElementById('preview-css').textContent = generateCSS('none', '', '', 0);
            break;

        case 2: // Test Private Browsing access
            document.getElementById('width-test').classList.remove('show');
            document.getElementById('width-heading').classList.add('success');
            document.getElementById('private-test').classList.add('show');
            document.getElementById('private-note').classList.add('show');

            UI.button.width.yes.removeEventListener('click', testController);
            UI.button.width.no.removeEventListener('click', testController);

            isAllowPrivateBrowsing = await browser.extension.isAllowedIncognitoAccess((isAllowPrivateBrowsing) => {
                if (isAllowPrivateBrowsing) {
                    endStage(3);
                } else {
                    UI.button.private.yes.addEventListener('click', testController);
                    UI.button.private.no.addEventListener('click', testController);
                }
            });
            break;

        case 3: // Test completed
            document.getElementById('private-test').classList.remove('show');
            document.getElementById('private-note').classList.remove('show');
            document.getElementById('private-heading').classList.add('success');
            document.getElementById('finish-test').classList.add('show');

            isAllowPrivateBrowsing = await browser.extension.isAllowedIncognitoAccess((isAllowPrivateBrowsing) => {
                if (isAllowPrivateBrowsing) {
                    document.getElementById('private-ignored').style.display = 'none';
                }
            });
            break;
    }
}

/**
 * Fail a stage with an error
 * @param {number} stage 
 */
function failStage(stage) {
    switch (stage) {
        case 1: // Failed scrollbar colors
            document.getElementById('color-test').classList.remove('show');
            document.getElementById('color-fail').classList.add('show');

            UI.button.color.yes.removeEventListener('click', testController);
            UI.button.color.no.removeEventListener('click', testController);
            UI.button.color.fix.addEventListener('click', () => {
                window.open('https://github.com/WesleyBranton/Custom-Scrollbar/wiki/No-color-customizations', '_blank');
            });
            break;

        case 2: // Failed scrollbar width
            document.getElementById('width-test').classList.remove('show');
            document.getElementById('width-fail').classList.add('show');

            UI.button.width.yes.removeEventListener('click', testController);
            UI.button.width.no.removeEventListener('click', testController);
            UI.button.width.fix.addEventListener('click', () => {
                window.open('https://github.com/WesleyBranton/Custom-Scrollbar/wiki/No-width-customizations', '_blank');
            });
            break;

        case 3: // Failed Private Browsing access
            window.open('https://github.com/WesleyBranton/Custom-Scrollbar/wiki/No-customizations-in-Private-Browsing-mode', '_blank');
            break;
    }
}

/**
 * Automatically bypasses the color and width tests for Firefox 79+
 * @async
 */
async function handleVersion79() {
    if (isChrome) return;

    const browserInfo = await browser.runtime.getBrowserInfo();
    const browserVersion = parseInt(browserInfo.version.split('.', 1)[0]);

    if (browserVersion >= 79) {
        endStage(1);
        endStage(2);
    }
}

const UI = {
    preview: document.getElementById('preview'),
    button: {
        color: {
            yes: document.getElementById('color-yes'),
            no: document.getElementById('color-no'),
            fix: document.getElementById('color-fix')
        },
        width: {
            yes: document.getElementById('width-yes'),
            no: document.getElementById('width-no'),
            fix: document.getElementById('width-fix')
        },
        private: {
            yes: document.getElementById('private-yes'),
            no: document.getElementById('private-no')
        }
    }
}

let currentStage = 1;
let isChrome = false;

// Chromium specific code
if (typeof browser != "function") {
    isChrome = true;
    browser = chrome;
}

endStage(0);
handleVersion79();
