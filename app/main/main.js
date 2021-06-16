import { getStore } from './getStore';
import { actions } from './actions';
import * as chromiumNetErrors from 'chromium-net-errors';

const electron = require('electron')
const ipc = require('electron').ipcMain;
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const store = getStore();

let mainWindow;

ipc.on('integration-open', (_event, message) => {
    store.dispatch({
      type: actions.NEW_INTEGRATION
    });
})

function createWindow() {
    // mainWindow = new BrowserWindow({
    //     webPreferences: {
    //         enableRemoteModule: true,
    //         nodeIntegration: true,
    //       contextIsolation: false
    //     }
    // });

    // mainWindow.loadURL(`http://${process.env.ELECTRON_WEBPACK_WDS_HOST}:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    // mainWindow.webContents.openDevTools();

    store.dispatch({
        type: actions.LOAD_WINDOW
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (absaAccessWindow === null) {
        createWindow();
    }
});

process.on("uncaughtException", (error) => { 
    app.quit();
});

setInterval(() => {
    store.dispatch({
        type: actions.REFRESH_TOKEN
    });
}, 2000);