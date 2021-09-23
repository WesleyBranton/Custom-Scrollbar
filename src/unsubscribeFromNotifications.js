/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Add setting to system storage that prevents notifications from appearing when updated
 */
function unsubscribeFromNotificiations() {
    container.classList.add('processing');
    browser.storage.local.set({
        unsubscribedFromAllUpdateNotifications: true
    }, () => {
        toggleUnsubscribeContainers();
    });
}

/**
 * Remove setting to system storage that prevents notifications from appearing when updated
 */
function subscribeToNotificiations() {
    undoContainer.classList.add('processing');
    browser.storage.local.remove("unsubscribedFromAllUpdateNotifications", () => {
        toggleUnsubscribeContainers();
    });
}

/**
 * Check user settings to see if update notifications are enabled
 */
function toggleUnsubscribeContainers() {
    browser.storage.local.get('unsubscribedFromAllUpdateNotifications', (data) => {
        if (data.unsubscribedFromAllUpdateNotifications) {
            if (undoContainer) undoContainer.classList.remove('hide');
            if (container) container.classList.add('hide');
        } else {
            if (container) container.classList.remove('hide');
            if (undoContainer) undoContainer.classList.add('hide');
        }

        if (container) container.classList.remove('processing');
        if (undoContainer) undoContainer.classList.remove('processing');
    });
}

const button = document.getElementById('unsubscribeFromNotificiationsButton');
const undoButton = document.getElementById('unsubscribeFromNotificiationsUndoButton');
const container = document.getElementById('unsubscribeFromNotificiationsContainer');
const undoContainer = document.getElementById('unsubscribeFromNotificiationsUndoContainer');

if (button) button.addEventListener('click', unsubscribeFromNotificiations);
if (undoButton) undoButton.addEventListener('click', subscribeToNotificiations);
toggleUnsubscribeContainers();
