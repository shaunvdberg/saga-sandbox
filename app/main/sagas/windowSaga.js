import { BrowserWindow } from 'electron';
import { takeEvery, take, put, call, cancelled, fork, cancel, delay, all, select, actionChannel, spawn } from 'redux-saga/effects';
import { eventChannel, END, channel } from 'redux-saga';
import { actions } from '../actions';

const windows = new Map();

class GoogleWindow {
    constructor() {
        this.url = 'http://www.google.com';
    }

    * onLoad() {

    }

    * onClose() {

    }

    * onClosed() {

    }
}

const createWindowEventsChannel = (window) => {
    return new eventChannel(emit => {
        const onLoaded = () => {
            emit({
                type: windowEvents.LOADED,
                sender: window
            });
        };

        const onClose = () => {
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
    });
}

function* getNextWindowId() {
    let windows = yield select();
    let nextId = 0;

    windows.forEach(window => {
        if (window.id > nextId) {
            nextId = window.id;
        }
    });

    return ++nextId;
}

function* watchWindowEvents(channel) {
    try {
        while (true) {
            let event = yield take(channel);

            yield put({
                type: actions.WINDOW_EVENT,
                event: {
                    type: event.type,
                    sender: event.sender
                }
            });
        }
    } finally {
        console.log('watchWindowEvents process finished.');
    }
}

function* showWindowSaga({ options }) {
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
                // preload: path.resolve(path.join(__dirname, "preload.js")),
            }
        });

        let eventsChannel = yield call(createWindowEventsChannel, browserWindow);
        yield fork(watchWindowEvents, eventsChannel);

        browserWindow.windowId = window.id;
        browserWindow.loadURL(window.url);
        browserWindow.show();

        windows.set(window.id, browserWindow);

        // TODO: Maybe dispatch some kind of success action.
    } finally {
        console.log('showWindowSaga process finished.');
    }
}

// function* watchTokenRefresh() {
//     try {
//         let token = 0;

//         while (true) {
//             // let token = yield take(actions.TOKEN_REFRESHED);

//             yield delay(3000);

//             console.log(++token);
//         }
//     } finally {
//         console.log('watchTokenRefresh finished.');
//     }
// }

function* defaultWindowEventHandler(event, window) {
    const windowId = window.windowId;
    const tasks = [];

    try {
        if (event === windowEvents.LOADED) {
            console.log('do load ' + windowId);

            // yield put({
            //     type: actions.SUBSCRIBE_TOKE_REFRESH,
            //     sender: window
            // });
        } else if (event === windowEvents.CLOSE) {
            console.log('do close ' + windowId);
        } else if (event === windowEvents.CLOSED) {
            console.log('do closed ' + windowId);

            yield put({
                type: actions.UNSUBSCRIBE_TOKEN_REFRESH,
                sender: window
            });
        }
    } finally {
        console.log('defaultWindowEventHandler process finished.');
    }
}

function* frontEventHandler(eventChannel) {
    // Concrete window handlers.
    const handlers = new Map();
    handlers.set('default', defaultWindowEventHandler);

    try {
        while (true) {
            let event = yield take(eventChannel);
            let handler = handlers.get('default');

            // yield fork(watchTokenRefresh);

            // console.log(event);

            yield call(defaultWindowEventHandler, event.type, event.sender);
        }
    } finally {
        console.log('frontEventHandler finished.');
    }
}

const watchAllWindowEvents = () => fork(function* () {
    let allEventChannel = yield actionChannel(actions.WINDOW_EVENT);
    let windowEventChannel = new Map();

    // TODO: Keep handle on forked handlers in order to dispose/cancel.
    let eventHandlers = new Map();

    while (true) {
        let { event } = yield take(allEventChannel);

        let { sender } = event;
        let windowId = sender.windowId;

        if (!windowEventChannel.has(windowId)) {
            let chan = yield call(channel);
            windowEventChannel.set(windowId, chan);

            eventHandlers.set(windowId, yield fork(frontEventHandler, windowEventChannel.get(windowId)));
        }

        yield put(windowEventChannel.get(windowId), event);

        if (event.type === windowEvents.CLOSED) {
            yield put(windowEventChannel.get(windowId), END);

            eventHandlers.delete(windowId);
            windowEventChannel.delete(windowId);
            windows.delete(windowId);

            // Remove window from store.
            yield put({
                type: actions.REMOVE_WINDOW,
                windowId
            });
        }
    }
})

function* watchTokenRefresh(window) {
    while (true) {
        let { type, window } = yield take([actions.TOKEN_REFRESHED, actions.UNSUBSCRIBE_TOKEN_REFRESH]);

        if (action === actions.UNSUBSCRIBE_TOKEN_REFRESH) {
            console.log('lets break');
            break;
        }

        console.log(action);

        // console.log('window ' + window.windowId + ' token refreshed ' + token);
    }
}

function* initHandler() {

}

function* closedHandler() {

}

function* runner(options) {
    const options = {
        type: '',
        url: 'https://www.google.com',
        handlers: {
            initHandler,
            closedHandler
        }
    };

    yield call(showWindowSaga, { options });

    console.log('runner complete.');
}

export function* windowSaga() {
    yield all([
        takeEvery(actions.SHOW_WINDOW, runner),
        watchAllWindowEvents(),
        takeEvery(actions.SUBSCRIBE_TOKE_REFRESH, watchTokenRefresh)
    ]);
}