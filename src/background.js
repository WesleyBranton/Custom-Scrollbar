/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Apply options changes to CSS
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 */
async function applyStyle(settings) {
    settings = loadWithDefaults(settings);
    css = generateCSS(settings.width, settings.colorTrack, settings.colorThumb, settings.allowOverride);

    // Register content script (Firefox only)
    if (runningOn == browsers.FIREFOX) {
        const options = {
            allFrames: true,
            css: [{
                code: css
            }],
            matchAboutBlank: true,
            matches: ['<all_urls>'],
            runAt: 'document_start'
        };

        contentScript = await browser.contentScripts.register(options);
    }
}

/**
 * Load settings from Storage API
 * @async
 */
async function loadSettings() {
    await removeStyle();
    browser.storage.local.get(applyStyle);
}

/**
 * Remove the active content script (if required)
 * @async
 */
async function removeStyle() {
    if (contentScript) {
        await contentScript.unregister();
        contentScript = null;
    }
    return;
}

/**
 * Open options page on first install
 * @param {Object} details 
 */
function handleInstalled(details) {
    if (details.reason == 'install') {
        browser.runtime.openOptionsPage();
        browser.tabs.create({
            url: "https://addons.wesleybranton.com/customscrollbars/landing?locale=" + browser.i18n.getUILanguage(),
            active: true
        });
    }
}

let css = null;
let contentScript = null;

// Chromium specific code
if (runningOn != browsers.FIREFOX) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        sendResponse({ css: css });
    });
}

loadSettings();
browser.storage.onChanged.addListener(loadSettings);
browser.runtime.onInstalled.addListener(handleInstalled);
