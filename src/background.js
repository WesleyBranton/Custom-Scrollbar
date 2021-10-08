/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Initialize add-on on start up
 *   - Verifies Storage API integrity
 *   - Migrates Storage API data (if required)
 *   - Trigger Storage API caching
 *   - Open options page (if required)
 */
function init() {
    browser.storage.local.get(['schema', 'defaultProfile'], (data) => {
        if (data.defaultProfile) {
            cacheUserSettings();
        } else {
            if (typeof data.schema == 'undefined' || data.schema < 2) {
                console.warn('Old storage schema detected. Migrating data.');
                migrateStorage();
            }
        }

        openOptionsPageIfRequired();
    });
}

/**
 * Set up uninstall page
 */
function setUninstallPage() {
    const paramBrowser = (runningOn == browsers.FIREFOX) ? 'firefox' : 'chromium';
    const paramVersion = browser.runtime.getManifest().version;
    browser.runtime.getPlatformInfo((platform) => {
        browser.runtime.setUninstallURL(`${webBase}/uninstall/?browser=${paramBrowser}&os=${platform.os}&version=${paramVersion}`);
    });
}

/**
 * Handle installation or update of the add-on
 *   - New installation opens welcome page and options page
 *   - Update sets what's new alert and opens update page (if required)
 * @param {Object} details
 */
function handleInstalled(details) {
    if (details.reason == 'install') {
        browser.tabs.create({
            url: `${webBase}/welcome/1?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`,
            active: true
        });

        showOptions = true;
        openOptionsPageIfRequired();
    } else if (details.reason == 'update') {
        browser.storage.local.get("unsubscribedFromAllUpdateNotifications", (data) => {
            if (!data.unsubscribedFromAllUpdateNotifications) {
                const previousVersion = parseFloat(details.previousVersion);
                let updatePage = null;

                if (details.previousVersion == "3.1.1" && runningOn == browsers.FIREFOX) {
                    updatePage = 'v3_1_2';
                } else if (previousVersion < 3) {
                    updatePage = 'v3_0';
                } else if (previousVersion < 2.2) {
                    updatePage = 'v2_2';
                }

                if (updatePage != null) {
                    browser.tabs.create({
                        url: `${webBase}/update/${updatePage}?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`
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
 * Migrate old data to the profile model
 *   - Moves existing settings to new profile
 *   - Sets new profile as default
 */
function migrateStorage() {
    browser.storage.local.get((data) => {
        const migrated = {
            schema: 2,
            defaultProfile: Date.now()
        }

        migrated[`profile_${migrated.defaultProfile}`] = data;
        migrated[`profile_${migrated.defaultProfile}`]['name'] = browser.i18n.getMessage('migratedProfileName');

        browser.storage.local.clear(() => {
            browser.storage.local.set(migrated, cacheUserSettings);
        });
    });
}

/**
 * Open add-on options page (if data is loaded)
 */
function openOptionsPageIfRequired() {
    if (showOptions && loaded) {
        showOptions = false;
        browser.runtime.openOptionsPage();
    }
}

/**
 * Load and cache basic user settings from Storage API
 */
function cacheUserSettings() {
    browser.storage.local.get(['defaultProfile', 'rules', 'framesInherit', 'localFileProfile'], (data) => {
        defaultProfile = data.defaultProfile;
        rules = (data.rules) ? data.rules : {};
        framesInherit = (typeof data.framesInherit == 'boolean') ? data.framesInherit : true;
        localFileProfile = (typeof data.localFileProfile == 'number') ? `profile_${data.localFileProfile}` : null;

        //Load and cache CSS of default profile
        if (data.defaultProfile) {
            browser.storage.local.get(`profile_${data.defaultProfile}`, (profile) => {
                defaultCSS = loadCSSForProfile(profile, `profile_${data.defaultProfile}`, true);
                loaded = true;
                openOptionsPageIfRequired();
                updateCSSOnAllPorts();
            });
        }
    });
}

/**
 * Handle incoming messages from the browser runtime
 * @param {Object} message
 * @param {Object} sender
 * @param {Function} sendResponse
 */
function handleMessage(message, sender, sendResponse) {
    switch (message.action) {
        case 'isTabConnectedToPort':
            sendResponse(isTabConnectedToPort(message.tabId));
            break;
        case 'openAddonOptions':
            browser.runtime.openOptionsPage();
            break;
    }
}

/**
 * Checks if tab has a registered port
 * @param {number} tabId
 * @returns Has port
 */
function isTabConnectedToPort(tabId) {
    for (const port of Object.values(ports)) {
        if (port.sender.tab.id == tabId) {
            return true;
        }
    }

    return false;
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
 * Tell all content scripts to ask again for CSS
 */
function updateCSSOnAllPorts() {
    for (const port of Object.values(ports)) {
        port.postMessage({
            action: 'queryCSS'
        });
    }
}

/**
 * Send CSS to port based on user rules
 * @param {Object} port
 */
function sendCSSToPort(port) {
    // Abort if Storage API is still loading
    if (!loaded) {
        return;
    }

    let profileKey, url;

    // Load URL based on user settings and permissions
    if (framesInherit && typeof port.sender.tab.url != 'undefined') {
        url = new URL(port.sender.tab.url);
    } else {
        url = new URL(port.sender.url);
    }

    // Load profile ID based on user rules
    if (url.protocol == 'file:') {
        profileKey = localFileProfile;
    } else {
        profileKey = getRuleForDomain(url.hostname);
    }

    // Generate CSS and send to port
    if (profileKey && profileKey != 'default') {
        browser.storage.local.get(profileKey, (profile) => {
            const css = loadCSSForProfile(profile, profileKey, false);
            port.postMessage({
                action: 'updateCSS',
                css: (css == null) ? defaultCSS : css
            });
        });
    } else {
        port.postMessage({
            action: 'updateCSS',
            css: defaultCSS
        });
    }
}

/**
 * Find rule that matches domain name
 *   - Returns null if no rule is found for the domain
 * @param {String} domain
 * @returns Profile ID
 */
function getRuleForDomain(domain) {
    // Check for regular rule
    if (rules[domain]) {
        return rules[domain];
    }

    const subdomains = domain.split('.');
    subdomains[subdomains.length - 2] += '.' + subdomains.pop();

    // Check for subdomain rules
    do {
        subdomains[0] = '*';
        const subdomain = subdomains.join('.');

        if (rules[subdomain]) {
            return rules[subdomain];
        }

        subdomains.shift();
    } while (subdomains.length > 1);

    return null;
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
browser.storage.onChanged.addListener(cacheUserSettings);
browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(handleMessage);
init();
setUninstallPage();
