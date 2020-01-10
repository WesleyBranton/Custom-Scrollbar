/**
 * Register content script
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 */
async function applyStyle(width, colorTrack, colorThumb) {
    console.log("Applying styles...");
    let css = generateCSS(width, colorTrack, colorThumb);
    let options = {
        allFrames: true,
        css: [{
            code: css
        }],
        matchAboutBlank: true,
        matches: ['<all_urls>'],
        runAt: 'document_start'
    };
    
    contentScript = await browser.contentScripts.register(options);
    console.log("Styles applied!");
}

/**
 * Generate CSS code
 * @param {string} width
 * @param {string} colorTrack
 * @param {string} colorThumb
 * @return {string} css
 */
function generateCSS(width, colorTrack, colorThumb) {
    console.log("Generating CSS...");
    let css, color;
    
    if (!width) {
        width = 'unset';
    }
    
    if (colorTrack && colorThumb) {
        color = colorThumb + ' ' + colorTrack;
    } else {
        color = 'unset';
    }
    
    css = '* { ';
    css += 'scrollbar-width: ' + width + ' !important; ';
    css += 'scrollbar-color: ' + color + ' !important; ';
    css += '}';
    
    console.log("CSS generated!");
    
    return css;
}

/**
 * Load settings from Storage API
 * @async
 */
async function loadSettings() {
    console.log("Loading settings....");
    await removeStyle();
    let setting = await browser.storage.local.get();
    
    if (!setting.width) {
        await firstRun();
        return;
    }
    
    console.log("Settings loaded!");
    
    applyStyle(
        setting.width,
        setting.colorTrack,
        setting.colorThumb
    );
}

/**
 * Initialize Storage API
 */
async function firstRun() {
    console.log("First run detected!");
    await browser.storage.local.set({
        width: 'unset',
        colorTrack: '',
        colorThumb: ''
    });
    return;
}

/**
 * Remove the active content script
 */
async function removeStyle() {
    console.log("Removing styles...");
    if (contentScript) {
        await contentScript.unregister();
        contentScript = null;
    }
    console.log("Styles removed!");
    return;
}

let contentScript = null;
browser.storage.onChanged.addListener(loadSettings);
loadSettings();
