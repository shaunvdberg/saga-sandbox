import { actions } from '../actions';

export const windowReducer = (state=[], action) => {
    if (action.type === actions.CREATE_WINDOW) {
        return [ ...state, action.window ];
    } else if (action.type === actions.REMOVE_WINDOW) {
        let index = state.findIndex(w => w.id === action.windowId);

        if (index !== -1) {
            return [ ...state.slice(0, index), ...state.slice(index + 1) ];
        }

        return state;
    }

    return state;
}