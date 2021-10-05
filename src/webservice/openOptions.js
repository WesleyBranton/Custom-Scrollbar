/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Ask background script to open add-on options page
 */
function openAddonOptions() {
    browser.runtime.sendMessage({
        action: "openAddonOptions"
    });
}

const openOptionsbutton = document.getElementById('openAddonOptionsButton');
const openOptionscontainer = document.getElementById('openAddonOptionsContainer');

if (openOptionsbutton) openOptionsbutton.addEventListener('click', openAddonOptions);
if (openOptionscontainer) openOptionscontainer.classList.remove('hide');