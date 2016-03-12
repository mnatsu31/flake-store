'use strict';

import { waitSymbol } from './waitFor';

export function pairs(object) {
  return Object.keys(object).reduce((current, key) => {
    current.push([key, object[key]]);
    return current;
  }, []);
}

export function objectToMap(object) {
  return new Map(pairs(object));
}

export function applyState(key, handler) {
  return (state, action) => {
    let stateOrWait = handler(state, action);
    let isWait = stateOrWait && stateOrWait[waitSymbol];
    return isWait ? stateOrWait : Promise.resolve(stateOrWait).then(value => {
      return { [key]: value };
    });
  };
}
