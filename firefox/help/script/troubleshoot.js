/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

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
    let isAllowPrivateBrowsing;

    switch (stage) {
        case 0:
            UI.button.color.yes.addEventListener('click', testController);
            UI.button.color.no.addEventListener('click', testController);

            UI.preview.setAttribute('style', 'scrollbar-width: default !important; scrollbar-color: blue red !important;');
            break;

        case 1:
            document.getElementById('color-test').classList.remove('show');
            document.getElementById('color-heading').classList.add('success');
            document.getElementById('width-test').classList.add('show');

            UI.button.color.yes.removeEventListener('click', testController);
            UI.button.color.no.removeEventListener('click', testController);
            UI.button.width.yes.addEventListener('click', testController);
            UI.button.width.no.addEventListener('click', testController);

            UI.preview.setAttribute('style', 'scrollbar-width: none !important; scrollbar-color: unset !important;');
            break;

        case 2:
            document.getElementById('width-test').classList.remove('show');
            document.getElementById('width-heading').classList.add('success');
            document.getElementById('private-test').classList.add('show');
            document.getElementById('private-note').classList.add('show');

            UI.button.width.yes.removeEventListener('click', testController);
            UI.button.width.no.removeEventListener('click', testController);

            isAllowPrivateBrowsing = await browser.extension.isAllowedIncognitoAccess();

            if (isAllowPrivateBrowsing) {
                endStage(3);
            } else {
                UI.button.private.yes.addEventListener('click', testController);
                UI.button.private.no.addEventListener('click', testController);
            }
            break;

        case 3:
            document.getElementById('private-test').classList.remove('show');
            document.getElementById('private-note').classList.remove('show');
            document.getElementById('private-heading').classList.add('success');
            document.getElementById('finish-test').classList.add('show');

            isAllowPrivateBrowsing = await browser.extension.isAllowedIncognitoAccess();

            if (isAllowPrivateBrowsing) {
                document.getElementById('private-ignored').style.display = 'none';
            }
            break;
    }
}

/**
 * Fail a stage with an error
 * @param {number} stage 
 */
function failStage(stage) {
    switch (stage) {
        case 1:
            document.getElementById('color-test').classList.remove('show');
            document.getElementById('color-fail').classList.add('show');

            UI.button.color.yes.removeEventListener('click', testController);
            UI.button.color.no.removeEventListener('click', testController);
            UI.button.color.fix.addEventListener('click', () => {
                window.open('https://github.com/WesleyBranton/Custom-Scrollbar/wiki/No-color-customizations', '_blank');
            });
            break;

        case 2:
            document.getElementById('width-test').classList.remove('show');
            document.getElementById('width-fail').classList.add('show');

            UI.button.width.yes.removeEventListener('click', testController);
            UI.button.width.no.removeEventListener('click', testController);
            UI.button.width.fix.addEventListener('click', () => {
                window.open('https://github.com/WesleyBranton/Custom-Scrollbar/wiki/No-width-customizations', '_blank');
            });
            break;

        case 3:
            window.open('https://github.com/WesleyBranton/Custom-Scrollbar/wiki/No-customizations-in-Private-Browsing-mode', '_blank');
            break;
    }
}

endStage(0);
