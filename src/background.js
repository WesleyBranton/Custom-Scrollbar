/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Apply options changes to CSS
 * @param {Object} profile
 * @param {String} key
 */
function applyStyle(profile, key) {
    defaultCSS = loadCSSForProfile(profile, key, true);
    loaded = true;
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
function refreshStorageData() {
    browser.storage.local.get(['defaultProfile', 'rules', 'framesInherit', 'localFileProfile'], (data) => {
        rules = (data.rules) ? data.rules : {};
        framesInherit = (typeof data.framesInherit == 'boolean') ? data.framesInherit : true;
        localFileProfile = (typeof data.localFileProfile == 'number') ? `profile_${data.localFileProfile}` : null;

        if (data.defaultProfile) {
            browser.storage.local.get(`profile_${data.defaultProfile}`, (profile) => {
                applyStyle(profile, `profile_${data.defaultProfile}`);
            });
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
        refreshStorageData();
    } else {
        if (typeof data.schema == 'undefined' || data.schema < 2) {
            console.warn('Old storage schema detected. Migrating data.');
            browser.storage.local.get(migrateStorage);
        }
    }

    if (showOptions) {
        showOptions = false;
        browser.runtime.openOptionsPage();
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
            refreshStorageData();
        });
    });
}

/**
 * Open options page on first install
 * @param {Object} details 
 */
function handleInstalled(details) {
    if (details.reason == 'install') {
        if (loaded) {
            browser.runtime.openOptionsPage();
        } else {
            showOptions = true;
        }
        browser.tabs.create({
            url: `${webBase}/welcome/1?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`,
            active: true
        });
    } else if (details.reason == 'update') {
        browser.storage.local.get("unsubscribedFromAllUpdateNotifications", (data) => {
            if (!data.unsubscribedFromAllUpdateNotifications) {
                const previousVersion = parseFloat(details.previousVersion);
                if (details.previousVersion == "3.1.1" && runningOn == browsers.FIREFOX) {
                    browser.tabs.create({
                        url: `${webBase}/update/v3_1_2?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`
                    });
                } else if (previousVersion < 3) {
                    browser.tabs.create({
                        url: `${webBase}/update/v3_0?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`
                    });
                } else if (previousVersion < 2.2) {
                    browser.tabs.create({
                        url: `${webBase}/update/v2_2?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`
                    });
                }
            }
        });

        if (details.previousVersion != browser.runtime.getManifest().version) {
            browser.storage.local.set({
                showWhatsNew: true
            });
        }
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
    if (message.action == 'getCSS') {
        if (!loaded) {
            return;
        }

        let rule;
        let url = new URL(port.sender.url);

        if (framesInherit && typeof port.sender.tab.url != 'undefined') {
            url = new URL(port.sender.tab.url);
        }

        if (url.protocol == 'file:') {
            rule = localFileProfile;
        } else {
            rule = getRule(url.hostname);
        }

        if (rule && rule != 'default') {
            browser.storage.local.get(rule, (profile) => {
                const css = loadCSSForProfile(profile, rule, false);

                if (css != null) {
                    sendCSSToPort(css, port);
                } else {
                    sendCSSToPort(defaultCSS, port);
                }
            });
        } else {
            sendCSSToPort(defaultCSS, port);
        }
    }
}

/**
 * Generate CSS for profile
 * @param {Object} profile
 * @returns CSS
 */
function loadCSSForProfile(profile, key, isDefault) {
    profile = profile[Object.keys(profile)[0]];

    if (typeof profile == 'undefined') {
        if (isDefault) {
            console.error('Default scrollbar "%s" cannot be loaded from storage.', key);
        } else {
            console.error('Scrollbar "%s" cannot be loaded from storage. Using default scrollbar.', key);
        }
        return null;
    }

    profile = loadWithDefaults(profile);
    const customWidth = profile.customWidthValue + profile.customWidthUnit;
    return generateCSS(profile.width, profile.colorTrack, profile.colorThumb, profile.allowOverride, customWidth, profile.buttons, profile.thumbRadius);
}

/**
 * Sends CSS code to port
 * @param {Object} port
 */
function sendCSSToPort(css, port) {
    port.postMessage({
        action: 'updateCSS',
        css: css
    });
}

/**
 * Find rule that matches domain name
 *     Returns null if no rule is found for the domain
 * @param {String} domain
 * @returns Profile ID
 */
function getRule(domain) {
    const domainParts = domain.split('.');
    let startAt = 0;

    while (startAt < domainParts.length - 1) {
        let selectedDomain = '';

        for (let i = startAt; i < domainParts.length; i++) {
            selectedDomain += '.' + domainParts[i];
        }

        if (startAt == 0) {
            selectedDomain = selectedDomain.substring(1);
        } else {
            selectedDomain = '*' + selectedDomain;
        }

        if (rules[selectedDomain]) {
            return rules[selectedDomain];
        }

        startAt++;
    }

    return null;
}

/**
 * Set up the uninstall page
 */
function setUninstallPage() {
    const paramBrowser = (runningOn == browsers.FIREFOX) ? 'firefox' : 'chromium';
    const paramVersion = browser.runtime.getManifest().version;
    browser.runtime.setUninstallURL(`${webBase}/uninstall/?browser=${paramBrowser}&version=${paramVersion}`);
}

/**
 * Handle incoming messages from the browser runtime
 * @param {Object} message
 * @param {Object} sender
 * @param {Function} sendResponse
 */
function handleMessage(message, sender, sendResponse) {
    switch (message.action) {
        case 'isTabRunningContentScript':
            sendResponse(isTabRunningContentScript(message.tabId));
            break;
        case 'openAddonOptions':
            browser.runtime.openOptionsPage();
            break;
    }
}

/**
 * Checks all connected ports to see if the scrollbars are being customized on that tab
 * @param {number} tabId
 * @returns Is content script running on tab
 */
function isTabRunningContentScript(tabId) {
    for (const port of Object.values(ports)) {
        if (port.sender.tab.id == tabId) {
            return true;
        }
    }

    return false;
}

let defaultCSS = null;
let contentScript = null;
let defaultProfile = null;
let ports = {};
let loaded = false;
let showOptions = false;
let rules = {};
let framesInherit = true;
let localFileProfile = null;

browser.runtime.onConnect.addListener(registerPort);
browser.storage.local.get(['schema', 'defaultProfile', 'rules'], firstLoad);
browser.storage.onChanged.addListener(refreshStorageData);
browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(handleMessage);
setUninstallPage();