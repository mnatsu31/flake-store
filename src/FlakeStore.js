'use strict';

import { EventEmitter } from 'events';

export const ActionTypes = {
  INIT: '@@flake/INIT'
};

export const CHANGE_EVENT = 'change';

class FlakeStore extends EventEmitter {
  constructor(dispatcher) {
    super()
    this.dispatcher = dispatcher;
    this.dispatcher.register(::this._handle);

    this.handlers = {};
    this.state = {};
  }
  // public methods
  getState() {
    return this.state;
  }
  register(handlers) {
    // update new handlers by initiale state
    this._update(handlers, { actionType: ActionTypes.INIT });
    // register new handlers
    this.handlers = { ...this.handlers, ...handlers };
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
    Object.keys(handlers).map((key) => {
      this.state[key] = handlers[key](this.state[key], action);
    });
    this.emit(CHANGE_EVENT);
  }
};

export default FlakeStore;
