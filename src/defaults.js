/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const defaults = {
    width: 'auto',
    color: 'unset',
    colorThumb: '#CDCDCDFF',
    colorTrack: '#F0F0F0FF',
    allowOverride: 0,
    customWidthValue: 17,
    customWidthUnit: 'px',
    buttons: 'none',
    thumbRadius: 0
}
const webBase = 'https://addons.wesleybranton.com/addon/custom-scrollbars';

/**
 * Validates the data loaded from storage
 * Ensures that missing settings are replaced with the defaults
 * @param {Object} data Data from storage
 * @returns Data with defaults 
 */
function loadWithDefaults(settings) {
    const keys = Object.keys(defaults);
    for (const key of keys) {
        if (typeof defaults[key] != typeof settings[key]) {
            settings[key] = defaults[key];
        }
    }
    return settings;
}
