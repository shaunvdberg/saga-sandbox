import { BrowserWindow } from 'electron';
import { takeEvery, take, put, call, cancelled, fork, cancel, delay, all, select, actionChannel, spawn, join } from 'redux-saga/effects';
import { eventChannel, END, channel, buffers } from 'redux-saga';
import { actions } from '../actions';
import path from 'path';

export const windowEvents = {
    LOADED: 'did-finish-load',
    CLOSE: 'close',
    CLOSED: 'closed',
};

const windows = new Map();

const createWindowEventsChannel = (window) => {
    return new eventChannel(emit => {
        const onLoaded = () => {
            emit({
                type: windowEvents.LOADED,
                sender: window
            });
        };

        const onClose = async (e) => {
            emit({
                type: windowEvents.CLOSE,
                sender: window
            });
        };

        const onClosed = () => {
            emit({
                type: windowEvents.CLOSED,
                sender: window
            });
            emit(END);
        };

        window.webContents.on(windowEvents.LOADED, onLoaded);
        window.on(windowEvents.CLOSE, onClose);
        window.on(windowEvents.CLOSED, onClosed);

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

function* watchWindowEvents(window, handlers) {
    try {
        let eventChannel = yield call(createWindowEventsChannel, window);

        while (true) {
            let event = yield take(eventChannel);

            console.log(event);

            yield put({
                type: actions.WINDOW_EVENT,
                event: {
                    type: event.type,
                    sender: event.sender
                }
            });

            if (event.type === 'did-finish-load') {
                yield call(handlers.initHandler, window);
            }    

            if (event.type === 'close') {
                yield call(handlers.closingHandler, window);
            }

            if (event.type === 'closed') {
                yield call(handlers.closedHandler, window);
            }
        }
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

export function* windowSaga() {
    yield all([
        // takeEvery(actions.SHOW_WINDOW, runner),
        // watchAllWindowEvents(),
        // takeEvery(actions.SUBSCRIBE_TOKE_REFRESH, watchTokenRefresh)
    ]);
}