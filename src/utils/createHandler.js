'use strict';

export function createHandler(key, handler) {
  let applyState = (state, action) => {
    let promiseOrState = handler(state, action);
    if (!(promiseOrState instanceof Promise)) {
      return Promise.resolve(promiseOrState);
    } else {
      return promiseOrState;
    }
  };
  return {
    key: key,
    applyState: applyState
  };
}
