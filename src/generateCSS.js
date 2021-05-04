/**
 * Generate CSS code
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 * @return {string} css
 */
function generateCSS(width, colorTrack, colorThumb, override, customWidth) {
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

    css = 
`* {
    scrollbar-width: ${width} ${(parseInt(override / 10) == 0) ? '!important' : ''};
    scrollbar-color: ${color} ${(override % 10 == 0) ? '!important' : ''};
}

::-webkit-scrollbar {
    width: ${widthPx} ${(parseInt(override / 10) == 0) ? '!important' : ''};
}

::-webkit-scrollbar-thumb {
    background: ${colorThumb} ${(override % 10 == 0) ? '!important' : ''};
}

::-webkit-scrollbar-track {
    background: ${colorTrack} ${(override % 10 == 0) ? '!important' : ''};
}`;

    return css;
}