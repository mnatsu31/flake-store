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
  }
  // public methods
  getState() {
    return this.state;
  }
  register(handlers) {
    // convert to Handler array
    handlers = Object.keys(handlers).map((key) => createHandler(key, handlers[key]));
    // update new handlers by initiale state
    this._update(handlers, { actionType: ActionTypes.INIT });
    // register new handlers
    this.handlers = [...this.handlers, ...handlers];
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
  // private methods
  _handle(action) {
    this._update(this.handlers, action);
  }
  _update(handlers, action) {
    let createReducer = (handler) => {
      return handlers.reduce((promise, handler) => {
        let key = handler.key;
        return promise.then((state) => {
          return handler.applyState(state[key], action).then((value) => {
            return { ...state, ...toHash(key, value) };
          });
        });
      }, Promise.resolve(this.state)).then((_state) => {
        this.reducer = undefined;
        this.state = _state;
        this.emit(CHANGE_EVENT);
      }).catch((e) => {
        // TODO: error handling
      });
    };

    if (!this.reducer) {
      this.reducer = createReducer(handlers);
    } else {
      this.reducer = this.reducer.then(() => createReducer(handlers));
    }
  }
};

export default FlakeStore;
