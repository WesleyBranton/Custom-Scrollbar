/**
 * Generate CSS code
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 * @return {string} css
 */
function generateCSS(width, colorTrack, colorThumb, override, customWidth, buttons) {
    let css, color, widthPx;

    if (width == 'thin') {
        widthPx = '7px';
    } else if (width == 'none') {
        widthPx = '0';
    } else if (width == 'other') {
        widthPx = customWidth;
    } else {
        widthPx = defaults.width;
    }

    if (colorTrack && colorThumb) {
        color = colorThumb + ' ' + colorTrack;
    } else {
        color = defaults.color;
        colorThumb = defaults.colorThumb;
        colorTrack = defaults.colorTrack;
    }

    if (runningOn == browsers.FIREFOX) {
        css = 
`* {
    scrollbar-width: ${width} ${(parseInt(override / 10) == 0) ? '!important' : ''};
    scrollbar-color: ${color} ${(override % 10 == 0) ? '!important' : ''};
}`;
    } else {
        const brightFactor = (isLightColor(colorThumb)) ? 1 : -1;
        let up, down, left, right;

        if (buttons != 'none') {
            up = browser.runtime.getURL(`images/components/${buttons}/up.svg`);
            down = browser.runtime.getURL(`images/components/${buttons}/down.svg`);
            left = browser.runtime.getURL(`images/components/${buttons}/left.svg`);
            right = browser.runtime.getURL(`images/components/${buttons}/right.svg`);
        }

        css = 
`::-webkit-scrollbar {
    width: ${widthPx} ${(parseInt(override / 10) == 0) ? '!important' : ''};
    height: ${widthPx} ${(parseInt(override / 10) == 0) ? '!important' : ''};
}

::-webkit-scrollbar-thumb {
    background: ${colorThumb} ${(override % 10 == 0) ? '!important' : ''};
}

::-webkit-scrollbar-thumb:hover {
    background: ${changeBrightness(colorThumb, 10 * brightFactor)} ${(override % 10 == 0) ? '!important' : ''};
}

::-webkit-scrollbar-thumb:active {
    background: ${changeBrightness(colorThumb, 30 * brightFactor)} ${(override % 10 == 0) ? '!important' : ''};
}

::-webkit-scrollbar-track {
    background: ${colorTrack} ${(override % 10 == 0) ? '!important' : ''};
}`;

if (buttons != 'none') {
    css += `
    ::-webkit-scrollbar-button {
        background-color: ${colorThumb} ${(override % 10 == 0) ? '!important' : ''};
        width: ${widthPx} ${(parseInt(override / 10) == 0) ? '!important' : ''};
        height: ${widthPx} ${(parseInt(override / 10) == 0) ? '!important' : ''};
        background-size: contain;
        background-position: center;
    }

    ::-webkit-scrollbar-button:hover {
        background-color: ${changeBrightness(colorThumb, 10 * brightFactor)} ${(override % 10 == 0) ? '!important' : ''};
    }

    ::-webkit-scrollbar-button:active {
        background-color: ${changeBrightness(colorThumb, 30 * brightFactor)} ${(override % 10 == 0) ? '!important' : ''};
    }

    ::-webkit-scrollbar-button:single-button:vertical:decrement {
        background-image: url(${up});
    }

    ::-webkit-scrollbar-button:single-button:vertical:increment {
        background-image: url(${down});
    }

    ::-webkit-scrollbar-button:single-button:horizontal:decrement {
        background-image: url(${left});
    }

    ::-webkit-scrollbar-button:single-button:horizontal:increment {
        background-image: url(${right});
    }`;
        }
    }

    return css;
}

/**
 * Change the brightness of a HEX color
 * @param {String} color
 * @param {number} percentage
 * @returns HEX color
 */
function changeBrightness(color, percentage) {
    const change = Math.round(2.55 * percentage);
    let hex = (color.charAt(0) == '#') ? '#' : '';

    for (let i = hex.length; i < 6; i += 2) {
        let updated = parseInt(color.substring(i, i + 2), 16) + change;
        if (updated > 255) {
            updated = 255;
        } else if (updated < 0) {
            updated = 0;
        }

        updated = updated.toString(16);
        if (updated.length < 2) {
            updated = '0' + updated;
        }

        hex += updated;
    }

    return hex + color.substring(hex.length, hex.length + 2);
}

/**
 * Determine if the color is light or dark
 * @param {String} color
 * @returns Is light
 */
function isLightColor(color) {
    if (color.charAt(0) == '#') {
        color = color.substring(1);
    }
    
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luma < 40;
}