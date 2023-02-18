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

        const brightFactor = (isLightColor(colorThumb)) ? 1 : -1;
        const hoverFactor = 10;
        const activeFactor = 30;

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
        thumbHover.set('background', changeBrightness(colorThumb, hoverFactor * brightFactor), overrideColor);
        css.push(thumbHover);

        const thumbActive = new CSSRule('::-webkit-scrollbar-thumb:active');
        thumbActive.set('background', changeBrightness(colorThumb, activeFactor * brightFactor), overrideColor);
        css.push(thumbActive);

        const track = new CSSRule('::-webkit-scrollbar-track');
        track.set('background', colorTrack, overrideColor);
        css.push(track);

        if (autoHide) {
            const trackNoHover = new CSSRule(':not(body):not(:hover):not(:focus)::-webkit-scrollbar-track');
            trackNoHover.set('background', 'transparent', true);
            css.push(trackNoHover);
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
