/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Apply options changes to CSS
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 */
function applyStyle(profile) {
    profile = profile[Object.keys(profile)[0]];

    if (typeof profile == 'undefined') {
        console.error('Settings profile cannot be loaded from storage.');
        return;
    }

    profile = loadWithDefaults(profile);
    const customWidth = profile.customWidthValue + profile.customWidthUnit;
    css = generateCSS(profile.width, profile.colorTrack, profile.colorThumb, profile.allowOverride, customWidth);
    updateCSSOnAllPorts();
}

/**
 * Send update message to all connected content scripts
 */
function updateCSSOnAllPorts() {
    for (let port of Object.values(ports)) {
        port.postMessage({
            action: 'queryCSS'
        });
    }
}

/**
 * Reload the CSS for the default profile
 */
function refreshDefault() {
    browser.storage.local.get('defaultProfile', (data) => {
        if (data.defaultProfile) {
            browser.storage.local.get(`profile_${data.defaultProfile}`, applyStyle);
        }
    });
}

/**
 * Load data from Storage API when add-on starts
 * @param {Object} data
 */
function firstLoad(data) {
    if (data.defaultProfile) {
        defaultProfile = data.defaultProfile;
        refreshDefault();
    } else {
        if (typeof data.schema == 'undefined' || data.schema < 2) {
            console.warn('Old storage schema detected. Migrating data.');
            browser.storage.local.get(migrateStorage);
        }
    }
}

/**
 * Migrate old data to the profile model
 * @param {Object} data
 */
function migrateStorage(data) {
    const id = Date.now();
    const migrated = {
        schema: 2,
        defaultProfile: id
    }
    migrated[`profile_${id}`] = data;
    migrated[`profile_${id}`]['name'] = browser.i18n.getMessage('migratedProfileName');

    browser.storage.local.clear(() => {
        browser.storage.local.set(migrated, () => {
            defaultProfile = id;
            refreshDefault();
        });
    });
}

/**
 * Open options page on first install
 * @param {Object} details 
 */
function handleInstalled(details) {
    if (details.reason == 'install') {
        browser.runtime.openOptionsPage();
        browser.tabs.create({
            url: "https://addons.wesleybranton.com/addon/custom-scrollbars/welcome/1?locale=" + browser.i18n.getUILanguage(),
            active: true
        });
    }
}

/**
 * Register a new port for content script
 * @param {Object} port
 */
function registerPort(port) {
    while (ports[port.name]) {
        port.name = parseInt(port.name) + 1 + "";
    }
    ports[port.name] = port;
    port.onDisconnect.addListener(unregisterPort);
    port.onMessage.addListener(handleMessageFromPort);
}

/**
 * Unregister a port for content script
 * @param {Object} port
 */
function unregisterPort(port) {
    delete ports[port.name];
}

/**
 * Handle incoming messages from content script
 * @param {Object} message
 * @param {Object} port
 */
function handleMessageFromPort(message, port) {
    switch (message.action) {
        case 'getCSS':
            sendCSSToPort(port);
            break;
    }
}

/**
 * Sends CSS code to port
 * @param {Object} port
 */
function sendCSSToPort(port) {
    port.postMessage({
        action: 'updateCSS',
        css: css
    });
}

let css = null;
let contentScript = null;
let defaultProfile = null;
let ports = {};

browser.runtime.onConnect.addListener(registerPort);
browser.storage.local.get(['schema', 'defaultProfile'], firstLoad);
browser.storage.onChanged.addListener(refreshDefault);
browser.runtime.onInstalled.addListener(handleInstalled);
