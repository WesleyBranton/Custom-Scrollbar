/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Add setting to system storage that prevents notifications from appearing when updated
 */
function unsubscribeFromNotificiations() {
    unsubscribeFromNotificationsContainer.classList.add('processing');
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
    undoUnsubscribeFromNotificationsContainer.classList.add('processing');
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
            if (undoUnsubscribeFromNotificationsContainer) undoUnsubscribeFromNotificationsContainer.classList.remove('hide');
            if (unsubscribeFromNotificationsContainer) unsubscribeFromNotificationsContainer.classList.add('hide');
        } else {
            if (unsubscribeFromNotificationsContainer) unsubscribeFromNotificationsContainer.classList.remove('hide');
            if (undoUnsubscribeFromNotificationsContainer) undoUnsubscribeFromNotificationsContainer.classList.add('hide');
        }

        if (unsubscribeFromNotificationsContainer) unsubscribeFromNotificationsContainer.classList.remove('processing');
        if (undoUnsubscribeFromNotificationsContainer) undoUnsubscribeFromNotificationsContainer.classList.remove('processing');
    });
}

const unsubscribeFromNotificationsButton = document.getElementById('unsubscribeFromNotificiationsButton');
const undoUnsubscribeFromNotificationsButton = document.getElementById('unsubscribeFromNotificiationsUndoButton');
const unsubscribeFromNotificationsContainer = document.getElementById('unsubscribeFromNotificiationsContainer');
const undoUnsubscribeFromNotificationsContainer = document.getElementById('unsubscribeFromNotificiationsUndoContainer');

if (unsubscribeFromNotificationsButton) unsubscribeFromNotificationsButton.addEventListener('click', unsubscribeFromNotificiations);
if (undoUnsubscribeFromNotificationsButton) undoUnsubscribeFromNotificationsButton.addEventListener('click', subscribeToNotificiations);
toggleUnsubscribeContainers();
