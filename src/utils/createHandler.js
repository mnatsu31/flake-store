'use strict';

export function createHandler(key, handler) {
  let applyState = (state, action) => {
    let promiseOrState = handler(state, action);
    if (!(promiseOrState instanceof Promise)) {
      return Promise.resolve({ [key]: promiseOrState });
    } else {
      return promiseOrState.then(value => { return { [key]: value } });
    }
  };
  return {
    key: key,
    applyState: applyState
  };
}
