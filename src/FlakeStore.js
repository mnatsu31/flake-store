'use strict';

import { EventEmitter } from 'events';
import { createHandler } from './utils/createHandler';

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
    this.handlers = [];
    this.handleError = () => {};
  }
  // public methods
  getState() {
    return _currentState;
  }
  register(handlers) {
    // convert to Handler array
    handlers = Object.keys(handlers).map((key) => createHandler(key, handlers[key]));
    // register new handlers
    this.handlers = [...this.handlers, ...handlers];
    // update new handlers by initiale state
    return this._update(handlers, { actionType: ActionTypes.INIT });
  }
  unregister(handlers) {
    let keys = Object.keys(handlers);
    this.handlers = this.handlers.filter((h) => keys.indexOf(h.key) === -1);
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
      let _createReducer = (handlers, state, action) => {
        let promises = handlers.map(h => h.applyState(state[h.key], action))
        return Promise.all(promises).then((results) => {
          return results.reduce((state, next) => {
            return { ...state, ...next }
          }, {});
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
