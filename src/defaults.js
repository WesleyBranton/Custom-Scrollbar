const defaults = {
    width: 'unset',
    color: 'unset',
    colorThumb: '#CDCDCDFF',
    colorTrack: '#F0F0F0FF',
    allowOverride: 0,
    customWidthValue: 17,
    customWidthUnit: 'px'
}

/**
 * Validates the data loaded from storage
 * Ensures that missing settings are replaced with the defaults
 * @param {Object} data Data from storage
 * @returns Data with defaults 
 */
function loadWithDefaults(settings) {
    const keys = Object.keys(defaults);
    for (k of keys) {
        if (typeof defaults[k] != typeof settings[k]) {
            settings[k] = defaults[k];
        }
    }
    return settings;
}