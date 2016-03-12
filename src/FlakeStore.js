'use strict';

import { EventEmitter } from 'events';
import { applyState, objectToMap } from './utils/_internal';

export const ActionTypes = {
  INIT: '@@flake/INIT'
};

export const CHANGE_EVENT = 'change';

let _currentState = {};

class FlakeStore extends EventEmitter {
  constructor() {
    super();
    this.reducer = null;
    this.queue = [];
    this.handlers = new Map();
    this.handleError = () => {};
  }
  // public methods
  getState() {
    return _currentState;
  }
  register(handlers) {
    // convert to Handler array
    let newMap = objectToMap(handlers);
    // register new handlers
    this.handlers = new Map([...this.handlers, ...newMap]);
    // update new handlers by initiale state
    return this._update(newMap, { actionType: ActionTypes.INIT });
  }
  unregister(handlers) {
    Object.keys(handlers).map((key) => {
      delete _currentState[key];
      this.handlers.delete(key);
    });
  }
  dispatch(action) {
    this._update(this.handlers, action);
  }
  subscribe(callback) {
    this.on(CHANGE_EVENT, callback);
  }
  unsubscribe(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
  onError(handleError) {
    this.handleError = handleError;
  }
  // private methods
  _update(handlers, action) {
    this.queue.push(action);
    return new Promise((resolve, reject) => {
      let _createReducer = (targets, state, action, isWaitHandler = false) => {
        let promises = new Map();
        let waits = new Map();
        for (let [key, handler] of targets.entries()) {
          let promiseOrWait = applyState(key, handler)((isWaitHandler ? state : state[key]), action);
          if (!(promiseOrWait instanceof Promise)) {
            waits.set(key, promiseOrWait);
          } else {
            promises.set(key, promiseOrWait);
          }
        }

        for (let [key, wait] of waits.entries()) {
          let restKeys = Array.from(waits.keys());
          if (wait.isReady(restKeys)) {
            waits.set(key, wait.callback(key));
          } else {
            waits.set(key, () => wait);
          }
        }

        let results = Promise.all(Array.from(promises.values())).then((results) => {
          return results.reduce((newState, next) => {
            return { ...newState, ...next }
          }, state);
        });

        return waits.size === 0 ? results : results.then(newState => {
          return _createReducer(waits, newState, action, true);
        });
      };

      let _handleQueue = (currentReducer) => {
        currentReducer
          .then(newState => {
            if (action = this.queue.shift()) {
              _handleQueue(_createReducer(handlers, newState, action));
            } else {
              _currentState = newState;
              this.reducer = null;
              this.emit(CHANGE_EVENT);
              resolve(newState);
            }
          })
          .catch(e => {
            this.reducer = null;
            this.handleError(e);
            reject(e);
          });
      };

      if (!this.reducer) {
        action = this.queue.shift();
        this.reducer = _createReducer(handlers, _currentState, action);
        _handleQueue(this.reducer);
      }
    });
  }
};

export default FlakeStore;
