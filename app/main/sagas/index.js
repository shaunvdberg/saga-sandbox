// export { windowSaga } from './shortWindowsSaga';
// export { integrationSaga } from './integrationSaga';

import { call, all, spawn } from 'redux-saga/effects';
import { windowSaga } from './shortWindowsSaga';
import { integrationSaga } from './integrationSaga';

export default function* root() {
    const sagas = [
        windowSaga,
        integrationSaga
    ];

    yield all(sagas.map(saga =>
        spawn(function* () {
            while (true) {
                yield call(saga)
                break;
            }
        }))
    );
}