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

    });
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
                const currentVersionHasUpdateNotice = true;
                const currentVersion = browser.runtime.getManifest().version;
                let updatePage = null;

                if (currentVersionHasUpdateNotice && compareVersionNumbers(details.previousVersion, currentVersion) == 2) {
                    const version = parseVersion(currentVersion);
                    updatePage = `v${version.major}_${version.minor}${(version.patch > 0) ? `_${version.patch}` : ''}`;
                } else if (compareVersionNumbers(details.previousVersion, "3.1.1") == 0 && runningOn == browsers.FIREFOX) {
                    updatePage = 'v3_1_2';
                } else if (compareVersionNumbers(details.previousVersion, "3.0") == 2) {
                    updatePage = 'v3_0';
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

    init(details.reason == 'install');
}

/**
 * Compare two version numbers
 * @param {string} v1 Version number
 * @param {string} v2 Version number
 * @returns Same (0), v1 > v2 (1), v2 > v1 (2)
 */
function compareVersionNumbers(v1, v2) {
    v1 = parseVersion(v1);
    v2 = parseVersion(v2);

    for (const key of ['major', 'minor', 'patch']) {
        if (v1[key] > v2[key]) {
            return 1;
        } else if (v1[key] < v2[key]) {
            return 2;
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
        const migrated = {
            schema: 2,
            defaultProfile: Date.now()
        }

        migrated[`profile_${migrated.defaultProfile}`] = data;
        migrated[`profile_${migrated.defaultProfile}`]['name'] = 'General';

        browser.storage.local.clear(() => {
            browser.storage.local.set(migrated, callback);
        });
    });
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
            browser: (getBrowserName() == 'firefox') ? 'firefox' : 'chromium',
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
        scrollbar = loadWithDefaults(scrollbar);
        const css = generateCSS(
            scrollbar.width,
            scrollbar.colorTrack,
            scrollbar.colorThumb,
            scrollbar.allowOverride,
            scrollbar.customWidthValue + scrollbar.customWidthUnit,
            scrollbar.buttons,
            scrollbar.thumbRadius
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
        browser.storage.local.get(scrollbarId, (scrollbar) => {
            scrollbar = scrollbar[Object.keys(scrollbar)[0]];

            if (typeof scrollbar == 'undefined') {
                if (scrollbarId == 'profile_' + data.defaultProfile) {
                    console.error('Default scrollbar "%s" cannot be loaded from storage.', scrollbarId);
                } else {
                    console.error('Scrollbar "%s" cannot be loaded from storage. Using default scrollbar.', scrollbarId);
                }
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
        if (data.framesInherit && sender.tab.url != null && typeof sender.tab.url == 'string') {
            callback(new URL(sender.tab.url));
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

// Run Chromium-specific tasks
if (typeof browser != 'object') {
    browser = chrome;
    browser.tabs.insertCSS = (tabId, cssInjection) => {
        cssInjection = convertCssInjectionIntoChrome(tabId, cssInjection);
        browser.scripting.insertCSS(cssInjection);
    };
    browser.tabs.removeCSS = (tabId, cssInjection) => {
        cssInjection = convertCssInjectionIntoChrome(tabId, cssInjection);
        browser.scripting.removeCSS(cssInjection);
    };
    importScripts("crossbrowser.js", "defaults.js", "generateCSS.js");
}

browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onStartup.addListener(() => {
    init(false);
});
