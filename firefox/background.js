/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Register content script
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 */
async function applyStyle(width, colorTrack, colorThumb) {
    let css = generateCSS(width, colorTrack, colorThumb);
    let options = {
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

/**
 * Generate CSS code
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 * @return {string} css
 */
function generateCSS(width, colorTrack, colorThumb) {
    let css, color;

    if (!width) {
        width = 'unset';
    }

    if (colorTrack && colorThumb) {
        color = colorThumb + ' ' + colorTrack;
    } else {
        color = 'unset';
    }

    css = '* { ';
    css += 'scrollbar-width: ' + width + ' !important; ';
    css += 'scrollbar-color: ' + color + ' !important; ';
    css += '}';

    return css;
}

/**
 * Load settings from Storage API
 * @async
 */
async function loadSettings() {
    await removeStyle();
    let setting = await browser.storage.local.get();

    if (!setting.width) {
        await firstRun();
        return;
    }

    applyStyle(
        setting.width,
        setting.colorTrack,
        setting.colorThumb
    );
}

/**
 * Initialize Storage API
 */
async function firstRun() {
    await browser.storage.local.set({
        width: 'unset',
        colorTrack: '',
        colorThumb: ''
    });
    return;
}

/**
 * Remove the active content script
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
        browser.tabs.create({
            url: 'options/options.html'
        });
    }
}

let contentScript = null;
browser.storage.onChanged.addListener(loadSettings);
loadSettings();
browser.runtime.onInstalled.addListener(handleInstalled);
