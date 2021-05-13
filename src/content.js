/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Request the CSS code from background file
 * @param {Object} response 
 */
function injectCSS(css) {
    let sheet = document.getElementById('custom-scrollbar-css');

    if (!sheet) {
        sheet = document.createElement('style');
        sheet.setAttribute('type', 'text/css');
        sheet.id = 'custom-scrollbar-css';
        document.head.appendChild(sheet);
    }

    sheet.textContent = css;
}

/**
 * Request CSS from background script
 */
function refreshCSS() {
    port.postMessage({
        action: 'getCSS'
    });
}

/**
 * Handle incoming messages from background script
 * @param {Object} message
 */
function handleMessages(message) {
    switch (message.action) {
        case 'updateCSS':
            injectCSS(message.css);
            break;
        case 'queryCSS':
            refreshCSS();
            break;
    }
}

if (typeof browser != "object") browser = chrome;
const port = browser.runtime.connect({ name: Date.now() + "" });
port.onMessage.addListener(handleMessages);
refreshCSS();