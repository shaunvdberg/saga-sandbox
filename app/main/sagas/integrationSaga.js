import { takeEvery, take, put, call, cancelled, fork, cancel, delay, all, select, actionChannel, spawn, join } from 'redux-saga/effects';
import { actions } from '../actions';
import { showWindowSaga, windowEvents } from './shortWindowsSaga';

function* initHandler(window) {
    // yield put({
    //     type: actions.SUBSCRIBE_TOKEN_REFRESH,
    //     window
    // });

    // let { token } = yield select();
    // window.webContents.send('token-refresh', token);
}

function* closingHandler(window) {
    window.webContents.send('window-closing');
}

function* closedHandler(window) {
    // yield put({
    //     type: actions.UNSUBSCRIBE_TOKEN_REFRESH,
    //     window
    // });
}

function* newIntegrationSaga() {
    const options = {
        url: 'http://localhost:8080/fmconnect/electronIndex.html'
    };

    const handlers = {
        initHandler,
        closingHandler,
        closedHandler
    };

    yield call(showWindowSaga, options, handlers);
}

function* setAuthToken(window) {
    let { token } = yield select();
    
    window.webContents.send('token-refresh', token);
}

function* watchTokenRefresh(window) {
    yield call(setAuthToken, window);

    while (true) {
        yield take(actions.REFRESH_TOKEN);

        yield call(setAuthToken, window);
    } 
}

// const something = () => fork(function* () {
//     let subscribedWindows = new Map();

//     while (true) {
//         let { type, window } = yield take([actions.SUBSCRIBE_TOKEN_REFRESH, actions.UNSUBSCRIBE_TOKEN_REFRESH]);

//         if (type === actions.SUBSCRIBE_TOKEN_REFRESH) {
//             subscribedWindows.set(window.windowId, yield fork(watchTokenRefresh, window));
//         }

//         if (type === actions.UNSUBSCRIBE_TOKEN_REFRESH) {
//             subscribedWindows.get(window.windowId).cancel();
//             subscribedWindows.delete(window.windowId);
//         }
//     }
// });

function* takeEveryWindowEvent(handler) {
    yield fork(function* () {
        let eventChannel = yield actionChannel(actions.WINDOW_EVENT);
        let windowTasks = new Map();

        while (true) {
            let { event } = yield take(eventChannel);
            let { type, sender } = event;

            if (type === windowEvents.LOADED) {
                windowTasks.set(sender.windowId, yield fork(watchTokenRefresh, sender));
            }

            if (type === windowEvents.CLOSED) {
                windowTasks.get(sender.windowId).cancel();
                windowTasks.delete(sender.windowId);
            }
        }
    });
}

export function* integrationSaga() {
    yield all([
        takeEvery(actions.NEW_INTEGRATION, newIntegrationSaga),
        takeEveryWindowEvent()
        // takeEvery(actions.SUBSCRIBE_TOKEN_REFRESH, watchTokenRefresh)
    ]);
}