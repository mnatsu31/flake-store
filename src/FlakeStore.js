'use strict';

import { EventEmitter } from 'events';
import { createHandler } from './utils/createHandler';
import { toHash } from './utils/toHash';

export const ActionTypes = {
  INIT: '@@flake/INIT'
};

export const CHANGE_EVENT = 'change';

class FlakeStore extends EventEmitter {
  constructor(dispatcher) {
    super()
    this.dispatcher = dispatcher;
    this.dispatcher.register(::this._handle);

    this.handlers = [];
    this.state = {};

    this.reducer = undefined;
    this.handleError = () => {};
  }
  // public methods
  getState() {
    return this.state;
  }
  register(handlers) {
    // convert to Handler array
    handlers = Object.keys(handlers).map((key) => createHandler(key, handlers[key]));
    // register new handlers
    this.handlers = [...this.handlers, ...handlers];
    // update new handlers by initiale state
    return this._update(handlers, { actionType: ActionTypes.INIT });
  }
  dispatch(action) {
    this.dispatcher.dispatch(action);
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
  _handle(action) {
    this._update(this.handlers, action);
  }
  _update(handlers, action) {
    let createReducer = () => {
      return handlers.reduce((p, h) => {
        return p.then((state) => {
          return h.applyState(state[h.key], action).then((value) => {
            return { ...state, ...toHash(h.key, value) };
          });
        });
      }, Promise.resolve(this.state));
    };

    this.reducer = !this.reducer ? createReducer() : this.reducer.then(() => createReducer());

    return this.reducer
      .then((_state) => {
        this.reducer = undefined;
        this.state = _state;
        this.emit(CHANGE_EVENT);
        return _state;
      })
      .catch(this.handleError);
  }
};

export default FlakeStore;
