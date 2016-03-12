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
    callback(key) {
      return (state) => {
        let dependencies = waitKeys.reduce((current, next) => {
          current[next] = state[next];
          return current;
        }, {});
        return callback(state[key], dependencies);
      }
    },
    isReady(restKeys) {
      return xor(waitKeys, restKeys).length === 0;
    }
  };
}
