/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load data from storage API
 */
function load() {
    showProgressBar(true);
    browser.storage.local.get(['unsubscribedFromAllUpdateNotifications'], (data) => {
        document.settings.unsubscribedFromAllUpdateNotifications.value = (data.unsubscribedFromAllUpdateNotifications) ? true : false;
        showProgressBar(false);
    });
}

/**
 * Save data to storage API
 */
function save() {
    showProgressBar(true);
    
    const storage = {
        unsubscribedFromAllUpdateNotifications: document.settings.unsubscribedFromAllUpdateNotifications.value == 'true'
    };

    browser.storage.local.set(storage, () => {
        toggleChangesWarning(false);
        showProgressBar(false);
    });
}

load();

document.getElementById('saveChanges').addEventListener('click', save);
document.settings.addEventListener('change', () => {
    toggleChangesWarning(true);
});