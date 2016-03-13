'use strict';

import { wrapPromise } from './_internal';

export function mergeHandlers(handlers = [], initialState) {
  return (state, action) => {
    if (Array.isArray(handlers)) {
      return handlers.reduce((p, handler) => {
        return p.then(currentState => wrapPromise(handler(currentState, action)));
      }, wrapPromise(state));
    } else if (Object(handlers) === handlers) {
      return Object.keys(handlers).reduce((p, key) => {
        return p.then(currentState => {
          return wrapPromise(handlers[key](currentState[key], action)).then(eachState => {
            currentState[key] = eachState;
            return currentState;
          });
        });
      }, wrapPromise(state || {}));
    } else {
      throw new Exception('mergeHandlers supports only array of handler[Object] or handlers object.');
    }
  }
}
