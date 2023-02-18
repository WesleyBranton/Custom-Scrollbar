/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Generate CSS code
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 * @param {number} override
 * @param {string} customWidth
 * @param {string} buttons
 * @param {number} thumbRadius
 * @param {number} autoHide
 * @returns CSS
 */
function generateCSS(width, colorTrack, colorThumb, override, customWidth, buttons, thumbRadius, autoHide) {
    const css = [];
    const overrideWidth = parseInt(override / 10) == 0;
    const overrideColor = override % 10 == 0;
    autoHide = autoHide == 1;

    if (runningOn == browsers.FIREFOX) { // Firefox
        const all = new CSSRule('*');

        if (width != 'unset') {
            all.set('scrollbar-width', width, overrideWidth);
        }

        if (colorThumb && colorTrack) {
            all.set('scrollbar-color', `${colorThumb} ${colorTrack}`, overrideColor);
        }

        if (autoHide) {
            const allNoHover = new CSSRule(':not(:hover):not(:focus)');
            allNoHover.set('scrollbar-color', 'transparent transparent', true);
            css.push(allNoHover);

            all.set('transition', 'ease 0.3s scrollbar-color', false);
        }

        css.push(all);
    } else { // Chromium-based
        // Load default colors (if not set)
        if (!colorThumb || !colorTrack) {
            colorThumb = defaults.colorThumb;
            colorTrack = defaults.colorTrack;
        }

        // Convert width to unit value
        switch (width) {
            case 'thin':
                width = '7px';
                break;
            case 'none':
                width = '0';
                break;
            case 'other':
                width = customWidth;
                break;
            default:
                width = defaults.customWidthValue + defaults.customWidthUnit;
                break;
        }

        const brightFactor = getBestBrightnessFactor(colorThumb, colorTrack);

        const main = new CSSRule('::-webkit-scrollbar');
        main.set('width', width, overrideWidth);
        main.set('height', width, overrideWidth);
        css.push(main);

        const thumb = new CSSRule('::-webkit-scrollbar-thumb');
        thumb.set('background', colorThumb, overrideColor);
        thumb.set('border-radius', `calc(${width} / 2 * (${thumbRadius} / 100))`, true);

        if (autoHide) {
            const thumbNoHover = new CSSRule(':not(body):not(:hover):not(:focus)::-webkit-scrollbar-thumb');
            thumbNoHover.set('background', 'transparent', true);
            css.push(thumbNoHover);
        }

        css.push(thumb);

        const thumbHover = new CSSRule('::-webkit-scrollbar-thumb:hover');
        thumbHover.set('background', changeBrightness(colorThumb, HOVER_FACTOR * brightFactor), overrideColor);
        css.push(thumbHover);

        const thumbActive = new CSSRule('::-webkit-scrollbar-thumb:active');
        thumbActive.set('background', changeBrightness(colorThumb, ACTIVE_FACTOR * brightFactor), overrideColor);
        css.push(thumbActive);

        const track = new CSSRule('::-webkit-scrollbar-track');
        track.set('background', colorTrack, overrideColor);
        css.push(track);

        const corner = new CSSRule('::-webkit-scrollbar-corner');
        corner.set('background', colorTrack, overrideColor);
        css.push(corner);

        if (autoHide) {
            const trackNoHover = new CSSRule(':not(body):not(:hover):not(:focus)::-webkit-scrollbar-track');
            trackNoHover.set('background', 'transparent', true);
            css.push(trackNoHover);

            const cornerNoHover = new CSSRule(':not(body):not(:hover):not(:focus)::-webkit-scrollbar-corner');
            cornerNoHover.set('backbround', 'transparent', true);
            css.push(cornerNoHover);
        }

        if (buttons != 'none') {
            const images = {
                up: browser.runtime.getURL(`images/components/${buttons}/up.svg`),
                down: browser.runtime.getURL(`images/components/${buttons}/down.svg`),
                left: browser.runtime.getURL(`images/components/${buttons}/left.svg`),
                right: browser.runtime.getURL(`images/components/${buttons}/right.svg`)
            }

            const button = new CSSRule('::-webkit-scrollbar-button');
            button.set('background-color', colorThumb, overrideColor);
            button.set('background-size', 'contain', true);
            button.set('background-position', 'center', true);
            button.set('width', width, overrideWidth);
            button.set('height', width, overrideWidth);
            css.push(button);

            if (autoHide) {
                const buttonNoHover = new CSSRule(':not(body):not(:hover):not(:focus)::-webkit-scrollbar-button');
                buttonNoHover.set('display', 'none', true);
                css.push(buttonNoHover);
            }

            const buttonHover = new CSSRule('::-webkit-scrollbar-button:hover');
            buttonHover.set('background-color', changeBrightness(colorThumb, 10 * brightFactor), overrideColor);
            css.push(buttonHover);

            const buttonActive = new CSSRule('::-webkit-scrollbar-button:active');
            buttonActive.set('background-color', changeBrightness(colorThumb, 30 * brightFactor), overrideColor);
            css.push(buttonActive);

            const buttonUp = new CSSRule('::-webkit-scrollbar-button:single-button:vertical:decrement');
            buttonUp.set('background-image', `url(${images.up})`, true);
            css.push(buttonUp);

            const buttonDown = new CSSRule('::-webkit-scrollbar-button:single-button:vertical:increment');
            buttonDown.set('background-image', `url(${images.down})`, true);
            css.push(buttonDown);

            const buttonLeft = new CSSRule('::-webkit-scrollbar-button:single-button:horizontal:decrement');
            buttonLeft.set('background-image', `url(${images.left})`, true);
            css.push(buttonLeft);

            const buttonRight = new CSSRule('::-webkit-scrollbar-button:single-button:horizontal:increment');
            buttonRight.set('background-image', `url(${images.right})`, true);
            css.push(buttonRight);
        }
    }

    let output = '';

    for (const rule of css) {
        output += rule.toString();
    }

    return output;
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
 * Convert HEX color to RGB color
 * @param {String} hex
 * @returns RGB object
 */
function hexToRgb(hex) {
    if (hex.charAt(0) == '#') {
        hex = hex.substring(1);
    }

    return {
        red: parseInt(hex.substring(0, 2), 16),
        green: parseInt(hex.substring(2, 4), 16),
        blue: parseInt(hex.substring(4, 6), 16)
    };
}

/**
 * Get relative luminance
 *    As defined by: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @param {String} hex Color (HEX format)
 * @returns Luminance Value (0 = light, 1 = dark)
 */
function getRelativeLuminance(hex) {
    const color = hexToRgb(hex);

    for (const rgb of Object.keys(color)) {
        color[rgb] /= 255;

        if (color[rgb] <= 0.03928) {
            color[rgb] /= 12.92;
        } else {
            color[rgb] = Math.pow((color[rgb] + 0.055) / 1.055, 2.4);
        }
    }

    return 0.2126 * color.red + 0.7152 * color.green + 0.0722 * color.blue;
}

/**
 * Determine if the color is light or dark
 * @param {String} color Color (HEX format)
 * @returns Is light
 */
function isLightColor(color) {
    return Math.pow(getRelativeLuminance(color), 0.425) > 0.5;
}

/**
 * Get contrast between two colors
 * @param {String} hex1 Color (HEX format)
 * @param {String} hex2 Color (HEX format)
 * @returns Contrast ratio
 */
function getColorContrast(hex1, hex2) {
    const luma1 = getRelativeLuminance(hex1);
    const luma2 = getRelativeLuminance(hex2);
    return (Math.max(luma1, luma2) + 0.05) / (Math.min(luma1, luma2) + 0.05);
}

/**
 * Determine if thumb should be brighter or darker when hovered or clicked
 * @param {String} thumb  Color (HEX format)
 * @param {String} track  Color (HEX format)
 * @returns 1 = Brighten, -1 = Darken
 */
function getBestBrightnessFactor(thumb, track) {
    const suggestedFactor = (isLightColor(thumb)) ? -1 : 1;

    const suggestedHover = changeBrightness(thumb, HOVER_FACTOR * suggestedFactor);
    const otherHover = changeBrightness(thumb, HOVER_FACTOR * suggestedFactor * -1);
    const suggestedHoverContrast = getColorContrast(suggestedHover, track);
    const otherHoverContrast = getColorContrast(otherHover, track);

    if (suggestedHoverContrast >= 4 || suggestedHoverContrast > otherHoverContrast) {
        console.log('Hover ok:', suggestedHoverContrast, otherHoverContrast);
        return suggestedFactor;
    }

    const suggestedActive = changeBrightness(thumb, ACTIVE_FACTOR * suggestedFactor);
    const otherActive = changeBrightness(thumb, ACTIVE_FACTOR * suggestedFactor * -1);
    const suggestedActiveContrast = getColorContrast(suggestedActive, track);
    const otherActiveContrast = getColorContrast(otherActive, track);

    if (suggestedActiveContrast >= 4 || suggestedActiveContrast > otherActiveContrast) {
        return suggestedFactor;
    }

    return suggestedFactor * -1;
}

/**
 * Class used to store and create CSS rules
 */
class CSSRule {

    selector = null;
    rules = {};

    /**
     * Create new CSS rule
     * @param {string} selector
     */
    constructor(selector) {
        this.selector = selector;
    }

    /**
     * Set CSS rule property
     * @param {string} property
     * @param {string|number} value
     * @param {boolean} important
     */
    set(property, value, important) {
        this.rules[property] = {
            value: value,
            important: important
        };
    }

    /**
     * Convert to CSS string
     * @returns CSS
     */
    toString() {
        if (Object.keys(this.rules).length > 0) {
            let css = this.selector + ' {\n';

            for (const property of Object.keys(this.rules)) {
                css += `\t${property}: ${this.rules[property].value}`;

                if (this.rules[property].important) {
                    css += ' !important';
                }

                css += ';\n';
            }

            css += '}\n';
            return css;
        } else {
            return '';
        }
    }

}

const HOVER_FACTOR = 10;
const ACTIVE_FACTOR = 30;