'use strict';

export function createHandler(key, handler) {
  let applyState = (state, action) => {
    let promiseOrState = handler(state, action);
    return Promise.resolve(promiseOrState).then(value => { return { [key]: value } });
  };
  return {
    key: key,
    applyState: applyState
  };
}
