'use strict';

import { createHandler } from './createHandler';

export const waitSymbol = Symbol('flakestore/wait');

function xor(arr1, arr2) {
  return arr1.filter(key => arr2.indexOf(key) !== -1);
}

export function waitFor(waitKeys, callback) {
  waitKeys = Array.isArray(waitKeys) ? waitKeys : [waitKeys];
  return {
    [waitSymbol]: true,
    waitKeys: waitKeys,
    callback(state, allState) {
      let dependencies = waitKeys.reduce((current, next) => {
        current[next] = allState[next];
        return current;
      }, {});
      return callback(state, dependencies);
    },
    isReady(restKeys) {
      return xor(waitKeys, restKeys).length === 0;
    }
  };
}
