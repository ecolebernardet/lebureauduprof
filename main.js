const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow = null;
let pendingPdfPath = null;
let pageReady = false;

function getPdfFromArgs(argv) {
    return argv.find(a => a.toLowerCase().endsWith('.pdf') && fs.existsSync(a)) || null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

app.on('second-instance', (event, argv) => {
    const pdfArg = getPdfFromArgs(argv);
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        if (pdfArg) {
            if (pageReady) {
                mainWindow.webContents.send('open-pdf', pdfArg);
            } else {
                pendingPdfPath = pdfArg;
            }
        }
    }
});

function createWindow(pdfPath) {
    if (pdfPath) pendingPdfPath = pdfPath;

    // Spoofer le user-agent pour éviter le blocage YouTube/iframes
    const chromeVersion = process.versions.chrome || '120.0.0.0';
    const spoofedUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;

    mainWindow = new BrowserWindow({
        width: 1280, height: 800,
        title: 'Le Bureau du Prof',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false,
            webviewTag: true,
        }
    });

    // Appliquer le user-agent spoofé sur toutes les requêtes
    mainWindow.webContents.setUserAgent(spoofedUA);

    // Autoriser les permissions média (micro, caméra, autoplay vidéo)
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowed = ['media', 'audioCapture', 'videoCapture', 'notifications'];
        callback(allowed.includes(permission));
    });

    mainWindow.loadFile('index.html');
    mainWindow.once('ready-to-show', () => { mainWindow.maximize(); mainWindow.show(); });
    mainWindow.on('closed', () => { mainWindow = null; pageReady = false; });
}

ipcMain.on('page-ready', () => {
    pageReady = true;
    if (pendingPdfPath && mainWindow) {
        mainWindow.webContents.send('open-pdf', pendingPdfPath);
        pendingPdfPath = null;
    }
});

ipcMain.handle('read-pdf-file', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        return 'data:application/pdf;base64,' + data.toString('base64');
    } catch(err) {
        console.error('[Electron] Erreur lecture PDF :', err.message);
        return null;
    }
});

ipcMain.handle('capture-screenshot', async (event) => {
    try {
        const image = await mainWindow.webContents.capturePage();
        return image.toPNG();
    } catch(err) {
        console.error('[Electron] Erreur capture écran :', err.message);
        return null;
    }
});

// ── Fenêtre YouTube native (évite l'erreur 153 des iframes) ──────────────
let ytWindow = null;

ipcMain.on('open-youtube', (event, videoId) => {
    const chromeVersion = process.versions.chrome || '120.0.0.0';
    const spoofedUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;

    if (ytWindow && !ytWindow.isDestroyed()) {
        ytWindow.loadURL(`https://www.youtube.com/watch?v=${videoId}`);
        ytWindow.focus();
        return;
    }

    ytWindow = new BrowserWindow({
        width: 960, height: 600,
        title: 'YouTube',
        parent: mainWindow,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
        }
    });

    ytWindow.webContents.setUserAgent(spoofedUA);
    ytWindow.webContents.session.setPermissionRequestHandler((wc, permission, callback) => {
        callback(['media', 'audioCapture', 'videoCapture'].includes(permission));
    });

    ytWindow.loadURL(`https://www.youtube.com/watch?v=${videoId}`);
    ytWindow.setMenu(null);
    ytWindow.on('closed', () => { ytWindow = null; });
});

app.whenReady().then(() => {
    const pdfArg = getPdfFromArgs(process.argv);
    createWindow(pdfArg);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(null); });
