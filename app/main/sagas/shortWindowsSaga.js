import { app, BrowserWindow } from 'electron';
import { takeEvery, take, put, call, cancelled, fork, cancel, delay, all, select, actionChannel, spawn, join } from 'redux-saga/effects';
import { eventChannel, END, channel, buffers } from 'redux-saga';
import { actions } from '../actions';
import path from 'path';

export const windowEventActions = {
    LOADED: 'LOADED',
    CLOSE: 'CLOSE',
    CLOSED: 'CLOSED'
  };

const windows = new Map();

const createWindowEventsChannel = (window) => {
    return new eventChannel(emit => {
        const onLoaded = () => {
            emit({
                type: windowEventActions.LOADED,
                sender: window
            });
        };

        const onClose = async () => {
            emit({
                type: windowEventActions.CLOSE,
                sender: window
            });
        };

        const onClosed = () => {
            emit({
                type: windowEventActions.CLOSED,
                sender: window
            });
            emit(END);
        };

        window.webContents.on('did-finish-load', onLoaded);
        window.once('close', onClose);
        window.once('closed', onClosed);

        return () => {
            console.log('createWindowEventsChannel unsubscribed.');
        };
    }, buffers.expanding(10));
}

function* getNextWindowId() {
    let { windows } = yield select();
    let nextId = 0;

    windows.forEach(window => {
        if (window.id > nextId) {
            nextId = window.id;
        }
    });

    return ++nextId;
}

function* watchWindowEvents(window) {
    try {
        let eventChannel = yield call(createWindowEventsChannel, window);

        while (true) {
            let event = yield take(eventChannel);

            console.log(event);

            yield put({
                type: event.type,
                sender: event.sender
            });

            // if (event.type === 'did-finish-load') {
            //     yield call(handlers.initHandler, window);
            // }    

            // if (event.type === 'close') {
            //     yield call(handlers.closingHandler, window);
            // }

            // if (event.type === 'closed') {
            //     yield call(handlers.closedHandler, window);
            // }
        }
    } catch(e) {
        console.log(e);
    } finally {
        console.log('watchWindowEvents process finished.');
    }
}

export function* showWindowSaga(options, handlers) {
    try {
        let windowId = yield call(getNextWindowId);

        let window = {
            id: windowId,
            url: options.url
        }

        // Persist window to store.
        yield put({
            type: actions.CREATE_WINDOW,
            window
        });

        let browserWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.resolve(path.join(__dirname, "../preload.js")),
            }
        });

        // let watchAuthTokenRefreshTask = yield fork(watchAuthTokenRefresh, browserWindow);
        let watchWindowEventsTask = yield fork(watchWindowEvents, browserWindow, handlers);

        browserWindow.webContents.openDevTools();
        browserWindow.windowId = window.id;
        browserWindow.loadURL(window.url);
        browserWindow.once('ready-to-show', () => {
            browserWindow.show();
        });

        windows.set(window.id, browserWindow);

        yield join(watchWindowEventsTask);

        // watchAuthTokenRefreshTask.cancel();

        windows.delete(windowId);

        yield put({
            type: actions.REMOVE_WINDOW,
            windowId
        });

        // TODO: Maybe dispatch some kind of success action.
    } finally {
        console.log('showWindowSaga process finished.');
    }
}

function loadWindowSaga() {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
          contextIsolation: false
        }
    });

    mainWindow.loadURL(`http://${process.env.ELECTRON_WEBPACK_WDS_HOST}:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    mainWindow.webContents.openDevTools();
    mainWindow.on('close', () => {
        app.quit();
    });
    mainWindow.on('closed', () => {
        throw new Error('Something went wrong.');
    })
}

export function* windowSaga() {
    yield all([
        takeEvery(actions.LOAD_WINDOW, loadWindowSaga)
        // takeEvery(actions.SHOW_WINDOW, runner),
        // watchAllWindowEvents(),
        // takeEvery(actions.SUBSCRIBE_TOKE_REFRESH, watchTokenRefresh)
    ]);
}