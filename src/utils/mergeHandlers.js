'use strict';

import { reducePromises, wrapPromise, isPromise } from './_internal';
import { waitFor, waitSymbol } from './waitFor';

function _arrayOfHandlers(handlers) {
  return (state, action) => {
    let asyncResults = [];
    let waitKeys = [];
    let waitHandlers = [];

    let newState = handlers.reduce((newState, handler) => {
      let stateOrWait = handler(newState, action);
      if (stateOrWait && stateOrWait[waitSymbol]) {
        waitKeys = [...waitKeys, stateOrWait.waitKeys];
        waitHandlers.push(stateOrWait.callback);
      } else if (isPromise(stateOrWait)) {
        asyncResults.push(stateOrWait);
      } else {
        newState = { ...newState, ...stateOrWait };
      }
      return newState;
    }, state);

    if (waitKeys.length) {
      return waitFor(waitKeys, (state, dependencies) => {
        let waitResults = waitHandlers.map(handler => wrapPromise(handler(state, dependencies)));
        return reducePromises([...asyncResults, ...waitResults], newState);
      });
    } else if (asyncResults.length) {
      return reducePromises(asyncResults, newState);
    }

    return newState;
  };
}

function _handlersObject(handlers) {
  return (state, action) => {
    let asyncResults = [];
    let waitKeys = [];
    let waitHandlers = {};

    let newState = Object.keys(handlers).reduce((newState, key) => {
      let stateOrWait = handlers[key](newState[key], action);
      if (stateOrWait && stateOrWait[waitSymbol]) {
        waitKeys = [...waitKeys, stateOrWait.waitKeys];
        waitHandlers[key] = stateOrWait.callback;
      } else if (isPromise(stateOrWait)) {
        asyncResults.push(stateOrWait.then(value => { return { [key]: value } }));
      } else {
        newState[key] = stateOrWait;
      }
      return newState;
    }, state || {});

    if (waitKeys.length) {
      return waitFor(waitKeys, (state, dependencies) => {
        let waitResults = Object.keys(waitHandlers).map(key => {
          return wrapPromise(waitHandlers[key](state[key], dependencies)).then(value => { return { [key]: value } });
        });
        return reducePromises([...asyncResults, ...waitResults], newState);
      });
    } else if (asyncResults.length) {
      return reducePromises(asyncResults, newState);
    }

    return newState;
  };
}

export function mergeHandlers(handlers = []) {
  let mergedHandler;
  if (Array.isArray(handlers)) {
    mergedHandler = _arrayOfHandlers(handlers);
  } else if (Object(handlers) === handlers) {
    mergedHandler = _handlersObject(handlers);
  } else {
    throw new Exception('mergeHandlers supports only array of handler[Object] or handlers object.');
  }
  return mergedHandler;
}
