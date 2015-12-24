'use strict';

import assert from 'power-assert';

import FlakeStore from '../';
import { Dispatcher } from 'flux';

const store = new FlakeStore(new Dispatcher());

const INIT = 'INIT';
const INCREMENTS = 'INCREMENTS';
const DECREMENTS = 'DECREMENTS';

let counter = (state = 0, action) => {
  switch(action.actionType) {
    case INCREMENTS:
      return state + 1;
    case DECREMENTS:
      return state - 1;
    default:
      return state;
  }
}

store.register({ counter });

describe('FlakeStore', () => {
  it('handler test', () => {
    let state = counter(void 0, { actionType: INIT });
    assert.equal(state, 0);

    state = counter(state, { actionType: INCREMENTS });
    assert.equal(state, 1);

    state = counter(state, { actionType: INCREMENTS });
    assert.equal(state, 2);

    state = counter(state, { actionType: DECREMENTS });
    assert.equal(state, 1);

    state = counter(state, { actionType: INCREMENTS });
    assert.equal(state, 2);

    state = counter(state, { actionType: INCREMENTS });
    assert.equal(state, 3);
  });
  it('flow test', (done) => {
    store.subscribe(() => {
      let state = store.getState();
      if (state.counter === 3) {
        done();
      }
    });

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
});
