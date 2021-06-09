import { actions } from '../actions';

export const authReducer = (state=0, action) => {
    if (action.type === actions.REFRESH_TOKEN) {
        if (state === 0) {
            return 1;
        } else {
            return ++state;
        }
    }

    return state;
}