import { combineReducers } from "redux";
import { windowReducer } from "./windowReducer";
import { authReducer } from "./authReducer";

let reducers = {
    windows: windowReducer,
    token: authReducer
};

export const rootReducer = combineReducers({ ...reducers });