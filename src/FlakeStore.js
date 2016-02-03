'use strict';

import { EventEmitter } from 'events';
import { createHandler } from './utils/createHandler';

export const ActionTypes = {
  INIT: '@@flake/INIT'
};

export const CHANGE_EVENT = 'change';

let _state = {};

let _reducer = (arr) => arr.reduce((state, next) => {
  return { ...state, ...next }
}, {});

let _createReducer = (handlers, state, action) => {
  let promises = handlers.map(h => h.applyState(state[h.key], action))
  return Promise.all(promises).then(_reducer);
};

class FlakeStore extends EventEmitter {
  constructor() {
    super();
    this.handlers = [];
    this.handleError = () => {};
    this.reducer = Promise.resolve(_state);
  }
  // public methods
  getState() {
    return _state;
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
    this.reducer = this.reducer.then((state) => _createReducer(handlers, state, action));

    return this.reducer
      .then((newState) => {
        _state = newState;
        this.emit(CHANGE_EVENT);
        return newState;
      })
      .catch(this.handleError);
  }
};

export default FlakeStore;
