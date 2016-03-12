'use strict';

export function mergeHandlers(handlers = [], initialState) {
  return (state = initialState, action) => {
    return handlers.reduce((currentState, handler) => {
      return handler(currentState, action);
    }, state);
  }
}
