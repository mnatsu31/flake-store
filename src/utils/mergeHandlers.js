'use strict';

export function mergeHandlers(handlers = [], initialState) {
  return (state, action) => {
    if (Array.isArray(handlers)) {
      return handlers.reduce((currentState, handler) => {
        return { ...currentState, ...handler(currentState, action) };
      }, state);
    } else if (Object(handlers) === handlers) {
      return Object.keys(handlers).reduce((currentState, key) => {
        currentState[key] = handlers[key](currentState[key], action);
        return currentState;
      }, state || {});
    } else {
      throw new Exception('mergeHandlers supports only array of handler[Object] or handlers object.');
    }
  }
}
