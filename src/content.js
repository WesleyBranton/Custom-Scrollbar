/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Ask service worker to update CSS
 */
function updateCSS() {
    browser.runtime.sendMessage({
        action: "updateCSS",
        css: cssInjection
    });
}

/**
 * Save information from the service worker about CSS injection
 * @param {object} message
 */
function saveCSSInfo(message, sender, sendResponse) {
    switch (message.action) {
        case 'cache':
            cssInjection = message.data;
            break;
        case 'getURL':
            sendResponse(window.location.href);
            break;
    }
}

let cssInjection = null;

browser = (typeof browser == 'object') ? browser : chrome;

browser.runtime.onMessage.addListener(saveCSSInfo);
browser.storage.onChanged.addListener(updateCSS);

updateCSS();
