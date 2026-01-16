/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Initialize add-on on start up
 *   - Verifies Storage API integrity
 *   - Migrates Storage API data (if required)
 *   - Open options page (if required)
 * @param {boolean} openOptions
 */
function init(openOptions) {
    setUninstallPage();
    validateStorage(() => {
        if (openOptions) {
            browser.runtime.openOptionsPage();
        }

        loadContentScriptsOnDemand();
    });
}

/**
 * Load the content scripts into existing tabs if they are not already loaded (only required for Chromium MV3)
 */
function loadContentScriptsOnDemand() {
    if (typeof browser.storage.session == 'object') {
        browser.storage.session.get(['firstRunComplete'], (data) => {
            if (!data.firstRunComplete) {
                browser.tabs.query({}, (tabs) => {
                    for (const t of tabs) {
                        if (t.url) {
                            const url = new URL(t.url);

                            // Generic content scripts
                            browser.scripting.executeScript({
                                files: ["content.js"],
                                target: {
                                    allFrames: true,
                                    tabId: t.id
                                }
                            }, () => {
                                if (browser.runtime.lastError == 'undefined') {} // Used to hide content access errors);
                            });

                            // Onboarding page scripts
                            if (url.hostname == 'customscrollbars.com' || (url.hostname == 'addons.wesleybranton.com' && url.pathname.startsWith('/addon/custom-scrollbars/'))) {
                                browser.scripting.executeScript({
                                    files: ["crossbrowser.js", "webservice/unsubscribeFromNotifications.js", "webservice/openOptions.js"],
                                    target: {
                                        tabId: t.id
                                    }
                                });
                            }
                        }
                    }
                });

                browser.storage.session.set({
                    firstRunComplete: true
                })
            }
        });
    }
}

/**
 * Set up uninstall page
 */
function setUninstallPage() {
    getSystemDetails((details) => {
        browser.runtime.setUninstallURL(`${webBase}/uninstall/?browser=${details.browser}&os=${details.os}&version=${details.version}`);
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
    } else if (details.reason == 'update') {
        browser.storage.local.get(["unsubscribedFromAllUpdateNotifications"], (data) => {
            if (!data.unsubscribedFromAllUpdateNotifications) {
                const currentVersionHasUpdateNotice = false;
                const currentVersion = browser.runtime.getManifest().version;
                let updatePage = null;

                if (currentVersionHasUpdateNotice && compareVersionNumbers(details.previousVersion, currentVersion) < 0) {
                    const version = parseVersion(currentVersion);
                    updatePage = `v${version.major}_${version.minor}${(version.patch > 0) ? `_${version.patch}` : ''}`;
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

        // Change override value to "Only Width"
        if (compareVersionNumbers(details.previousVersion, '4.3') <= 0) {
            browser.storage.local.get((data) => {
                const update = {};

                for (const key of Object.keys(data)) {
                    if (!key.startsWith('profile_')) {
                        continue;
                    }

                    const scrollbar = data[key];

                    if (typeof scrollbar.allowOverride == 'number' && scrollbar.allowOverride == 0) {
                        scrollbar.allowOverride = 10;
                        update[key] = scrollbar;
                    }
                }

                browser.storage.local.set(update);
            });
        }
    }

    init(details.reason == 'install');
}

/**
 * Compare two version numbers
 * @param {string} v1 Version number
 * @param {string} v2 Version number
 * @returns Same (0), v1 < v2 (-1), v1 > v2 (1)
 */
function compareVersionNumbers(v1, v2) {
    v1 = parseVersion(v1);
    v2 = parseVersion(v2);

    for (const key of ['major', 'minor', 'patch']) {
        if (v1[key] > v2[key]) {
            return 1;
        } else if (v1[key] < v2[key]) {
            return -1;
        }
    }

    return 0;
}

/**
 * Parse semantic version number to object
 * @param {string|number} versionString Version number
 * @returns Version object
 */
function parseVersion(versionString) {
    versionString = versionString.toString().split('.');

    const version = {};
    let i = 0;

    for (const key of ['major', 'minor', 'patch']) {
        if (versionString.length > i) {
            const number = parseInt(versionString[i]);
            if (!isNaN(number)) {
                version[key] = number;
            } else {
                version[key] = 0;
            }
        } else {
            version[key] = 0;
        }
        ++i;
    }

    return version;
}

/**
 * Check if user settings are valid
 * @param {Function} callback
 */
function validateStorage(callback) {
    browser.storage.local.get(['schema', 'defaultProfile'], (data) => {
        if (typeof data.schema == 'undefined' || data.schema < 2) {
            console.warn('Old storage schema detected. Settings will be migrated.');
            migrateStorage(() => {
                callback();
            });
        } else {
            callback();
        }
    });
}

/**
 * Migrate old data to the profile model
 *   - Moves existing settings to new profile
 *   - Sets new profile as default
 * @param {Function} callback
 */
function migrateStorage(callback) {
    browser.storage.local.get((data) => {
        const migrated = (Object.keys(data).length > 0) ? {} : addDefaultScrollbars();

        migrated.schema = 2;
        migrated.defaultProfile = Date.now();

        migrated[`profile_${migrated.defaultProfile}`] = data;
        migrated[`profile_${migrated.defaultProfile}`]['name'] = (typeof browser.i18n.getMessage != 'undefined') ? browser.i18n.getMessage('migratedProfileName') : 'General';

        browser.storage.local.clear(() => {
            browser.storage.local.set(migrated, callback);
        });
    });
}

/**
 * Creates storage object with all default scrollbars
 * @returns Storage object
 */
function addDefaultScrollbars() {
    const storage = {};
    let id = Date.now();

    // Light
    const light = {};
    light.name = 'Light';
    light.colorTrack = '#F0F0F0FF';
    light.colorThumb = '#CDCDCDFF';
    storage[`profile_${++id}`] = light;

    // Light (Thin)
    const lightThin = {};
    lightThin.name = 'Light Thin';
    lightThin.colorTrack = '#F0F0F0FF';
    lightThin.colorThumb = '#CDCDCDFF';
    lightThin.width = 'thin';
    storage[`profile_${++id}`] = lightThin;

    // Dark
    const dark = {};
    dark.name = 'Dark';
    dark.colorTrack = '#2B2A33FF';
    dark.colorThumb = '#737387FF';
    storage[`profile_${++id}`] = dark;

    // Dark (Thin)
    const darkThin = {};
    darkThin.name = 'Dark Thin';
    darkThin.colorTrack = '#2B2A33FF';
    darkThin.colorThumb = '#737387FF';
    darkThin.width = 'thin';
    storage[`profile_${++id}`] = darkThin;

    return storage;
}

/**
 * Open feedback page in popup window
 */
function openFeedback() {
    getSystemDetails((details) => {
        browser.windows.create({
            height: 700,
            width: 450,
            type: browser.windows.CreateType.PANEL,
            url: `${webBase}/feedback/?browser=${details.browser}&os=${details.os}&version=${details.version}`
        });
    });
}

/**
 * Send system details to callback
 * @param {Function} callback
 */
function getSystemDetails(callback) {
    browser.runtime.getPlatformInfo((platform) => {
        callback({
            browser: getBrowserName().toLowerCase(),
            version: browser.runtime.getManifest().version,
            os: platform.os
        });
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
        case 'openAddonOptions':
            browser.runtime.openOptionsPage();
            break;
        case 'openFeedback':
            openFeedback();
            break;
        case 'updateCSS':
            updateCSS(message, sender);
            break;
    }
}

/**
 * Load CSS into frames
 * @param {object} message
 * @param {object} sender
 */
function updateCSS(message, sender) {
    // Remove old CSS (if required)
    if (message.css) {
        browser.tabs.removeCSS(sender.tab.id, message.css);
    }

    getCSS(sender, (css) => {
        const cssInjection = {
            code: css,
            frameId: sender.frameId,
            runAt: "document_start"
        };

        browser.tabs.insertCSS(sender.tab.id, cssInjection);
        browser.tabs.sendMessage(sender.tab.id, {
            action: 'cache',
            data: cssInjection
        }, {
            frameId: sender.frameId
        }, () => {
            if (browser.runtime.lastError == 'undefined') {} // Used to hide content access errors);
        });
    });
}

/**
 * Generate CSS for scrollbar and send to callback
 * @param {object} sender
 * @param {Function} callback
 */
function getCSS(sender, callback) {
    getScrollbar(sender, (scrollbar) => {
        if (scrollbar == null) {
            callback('');
            return;
        }

        scrollbar = loadWithDefaults(scrollbar);
        const css = generateCSS(
            scrollbar.width,
            scrollbar.colorTrack,
            scrollbar.colorThumb,
            scrollbar.allowOverride,
            scrollbar.customWidthValue + scrollbar.customWidthUnit,
            scrollbar.buttons,
            scrollbar.thumbRadius,
            scrollbar.autoHide
        );
        callback(css);
    });
}

/**
 * Get scrollbar from storage and send to callback
 * @param {object} sender
 * @param {Function} callback
 */
function getScrollbar(sender, callback) {
    getRule(sender, (scrollbarId) => {
        if (scrollbarId == 'profile_none') {
            callback(null);
            return;
        }

        browser.storage.local.get(scrollbarId, (scrollbar) => {
            scrollbar = scrollbar[Object.keys(scrollbar)[0]];

            if (typeof scrollbar == 'undefined') {
                console.error('Scrollbar "%s" cannot be loaded from storage. Using default scrollbar.', scrollbarId);
                getDefaultScrollbar(callback);
                return;
            }

            callback(scrollbar);
        });
    });
}

/**
 * Get default scrollbar from storage and send to callback
 * @param {Function} callback
 */
function getDefaultScrollbar(callback) {
    browser.storage.local.get('defaultProfile', (scrollbarId) => {
        scrollbarId = `profile_${scrollbarId.defaultProfile}`;

        if (scrollbarId == 'profile_none') {
            callback(null);
            return;
        }

        browser.storage.local.get(scrollbarId, (scrollbar) => {
            scrollbar = scrollbar[Object.keys(scrollbar)[0]];

            if (typeof scrollbar == 'undefined') {
                console.error('Scrollbar "%s" cannot be loaded from storage.', scrollbarId);
            }

            callback(scrollbar);
        });
    });
}

/**
 * Get scrollbar ID of rule for domain and send to callback
 * @param {object} sender
 * @param {Function} callback
 */
function getRule(sender, callback) {
    getURL(sender, (url) => {
        browser.storage.local.get(['rules', 'localFileProfile', 'defaultProfile'], (data) => {
            let scrollbarId = null;

            if (url.protocol == 'file:') {
                scrollbarId = data.localFileProfile;
            } else if (typeof data.rules == 'object') {
                if (data.rules[url.hostname]) {
                    scrollbarId = data.rules[url.hostname];
                } else {
                    const subdomains = url.hostname.split('.');
                    subdomains[subdomains.length - 2] += '.' + subdomains.pop();

                    do {
                        subdomains[0] = '*';
                        const subdomain = subdomains.join('.');

                        if (data.rules[subdomain]) {
                            scrollbarId = data.rules[subdomain];
                        }

                        subdomains.shift();
                    } while (subdomains.length > 1);
                }
            }

            if (!scrollbarId || scrollbarId == 'default') {
                scrollbarId = 'profile_' + data.defaultProfile;
            } else if (typeof scrollbarId != 'string' || !scrollbarId.startsWith('profile_')) {
                scrollbarId = 'profile_' + scrollbarId;
            }

            callback(scrollbarId);
        });
    });
}

/**
 * Get URL of page/tab and send to callback
 * @param {object} sender
 * @param {Function} callback
 */
function getURL(sender, callback) {
    browser.storage.local.get(['framesInherit'], (data) => {
        if (data.framesInherit) {
            if (sender.tab.url != null && typeof sender.tab.url == 'string') {
                callback(new URL(sender.tab.url));
            } else {
                browser.tabs.sendMessage(sender.tab.id, {
                    action: 'getURL'
                }, {
                    frameId: 0
                }, (url) => {
                    if (browser.runtime.lastError == 'undefined') {} // Used to hide content access errors);

                    if (url != null && typeof url == 'string') {
                        callback(new URL(url));
                    } else {
                        callback(new URL(sender.url));
                    }
                });
            }
        } else {
            callback(new URL(sender.url));
        }
    });
}

/**
 * Convert Firefox formatted CSS injection information to Chromium format
 * @param {number} tabId
 * @param {object} cssInjection
 * @returns cssInjection
 */
function convertCssInjectionIntoChrome(tabId, cssInjection) {
    const result = {};

    result.css = cssInjection.code;
    result.target = {};
    result.target.frameIds = [cssInjection.frameId];
    result.target.tabId = tabId;

    return result;
}

if (typeof browser != 'object') {
    browser = chrome;
}

switch (browser.runtime.getManifest().manifest_version) {
    case 2:
        break;
    case 3:
        browser.tabs.insertCSS = (tabId, cssInjection) => {
            cssInjection = convertCssInjectionIntoChrome(tabId, cssInjection);
            browser.scripting.insertCSS(cssInjection);
        };
        browser.tabs.removeCSS = (tabId, cssInjection) => {
            cssInjection = convertCssInjectionIntoChrome(tabId, cssInjection);
            browser.scripting.removeCSS(cssInjection);
        };
        importScripts("crossbrowser.js", "defaults.js", "generateCSS.js");
        break;
    default:
        console.error("Unsupported manifest version: %d", browser.runtime.getManifest().manifest_version);
        break;
}

browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onStartup.addListener(() => {
    init(false);
});
