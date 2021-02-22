/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Request the CSS code from background file
 * ** Only Chromium-based browsers need to use this
 * @param {Object} response 
 */
function injectCSS(response) {
    const sheet = document.createElement('style');
    sheet.setAttribute('type', 'text/css');
    sheet.id = 'custom-scrollbar-css';
    sheet.textContent = response.css;
    document.head.appendChild(sheet);
}

chrome.runtime.sendMessage('css', injectCSS);
