const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onOpenPdf: (callback) => {
        ipcRenderer.on('open-pdf', (event, filePath) => callback(filePath));
    },
    readPdfFile: (filePath) => {
        return ipcRenderer.invoke('read-pdf-file', filePath);
    },
    notifyReady: () => {
        ipcRenderer.send('page-ready');
    },
    openYoutube: (videoId) => {
        ipcRenderer.send('open-youtube', videoId);
    },
    captureScreenshot: () => {
        return ipcRenderer.invoke('capture-screenshot');
    },
    isElectron: true
});
