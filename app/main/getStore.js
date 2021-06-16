import {
    createStore,
    applyMiddleware
} from 'redux';

import { rootReducer } from './reducers/index';
import createSagaMiddleware from 'redux-saga';
// import * as sagas from './sagas';
import root from './sagas';

const initSagas = (middleware) => {
    // Object.values(sagas).forEach(saga => {
    //     console.log('Running saga ' + saga);

    //     middleware.run(saga);
    // });
    console.log(root);

    middleware.run(root);
}

export const getStore = () => {
    const sagaMiddleware = createSagaMiddleware({
        onError: (error) => {
            throw error;
        }
    });

    const middleware = [sagaMiddleware];
    const defaultState = {};

    const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

    initSagas(sagaMiddleware);

    return store;
};