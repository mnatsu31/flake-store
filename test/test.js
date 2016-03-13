'use strict';

import assert from 'power-assert';
import 'babel-polyfill';

import FlakeStore from '../';
import { mergeHandlers, waitFor } from '../';

const store = new FlakeStore();

const INIT = 'INIT';
const INCREMENTS = 'INCREMENTS';
const DECREMENTS = 'DECREMENTS';
const ERROR = 'ERROR';

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

let asyncCounter = (state = 0, action) => {
  switch(action.actionType) {
    case INCREMENTS:
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(state + 1);
        }, 1000);
      });
    case DECREMENTS:
      return state - 1;
    default:
      return state;
  }
}

let oddOrEven = (state = 'even', action) => {
  switch (action.actionType) {
    case INCREMENTS:
    case DECREMENTS:
      return waitFor('asyncCounter', (state, dependencies) => {
        return dependencies.asyncCounter % 2 === 0 ? 'even': 'odd';
      });
    default:
      return state;
  }
}

let upperCase = (state = '', action) => {
  switch (action.actionType) {
    case INCREMENTS:
    case DECREMENTS:
      return waitFor(['asyncCounter', 'oddOrEven'], (state, dependencies) => {
        return dependencies.oddOrEven.toUpperCase();
      });
    default:
      return state;
  }
}

let increments = (state = { num: 0, count: 0 }, action) => {
  switch(action.actionType) {
    case INCREMENTS:
      return { num: state.num + 1, count: state.count + 1 };
    default:
      return state;
  }
};

let decrements = (state = { num: 0, count: 0 }, action) => {
  switch(action.actionType) {
    case DECREMENTS:
      return { num: state.num - 1, count: state.count + 1 };
    default:
      return state;
  }
};

let wIncrements = (state = { num: 0, count: 0 }, action) => {
  switch(action.actionType) {
    case INCREMENTS:
      return waitFor('counter', (state, dependencies) => {
        return Promise.resolve({ num: state.num + 1, count: state.count + 1 });
      });
    default:
      return state;
  }
};

let pDecrements = (state = { num: 0, count: 0 }, action) => {
  switch(action.actionType) {
    case DECREMENTS:
      return Promise.resolve({ num: state.num - 1, count: state.count + 1 });
    default:
      return state;
  }
};

let errorHandler = (state = void 0, action) => {
  switch (action.actionType) {
    case ERROR:
      throw new Error('error');
    default:
      return state;
  }
}

let mo = mergeHandlers({ increments, decrements });
let mop = mergeHandlers({ increments, pDecrements });
let mow = mergeHandlers({ wIncrements, decrements });
let mopw = mergeHandlers({ wIncrements, pDecrements });
let ma = mergeHandlers([increments, decrements]);
let map = mergeHandlers([ increments, pDecrements ]);
let maw = mergeHandlers([ wIncrements, decrements ]);
let mapw = mergeHandlers([ wIncrements, pDecrements ]);

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
  it('sync flow test', (done) => {
    store.register({ counter });

    let subscriber = () => {
      let state = store.getState();
      if (state.counter === 3) {
        store.unsubscribe(subscriber);
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('async flow test', (done) => {
    store.register({ asyncCounter });

    let subscriber = () => {
      let state = store.getState();
      if (state.asyncCounter === 3) {
        store.unsubscribe(subscriber);
        store.unregister({ counter, asyncCounter });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('wait handlers', (done) => {
    store.register({ asyncCounter, oddOrEven, upperCase });

    let subscriber = () => {
      let state = store.getState();
      if (state.asyncCounter === 3 && state.oddOrEven === 'odd' && state.upperCase === 'ODD') {
        store.unsubscribe(subscriber);
        store.unregister({ asyncCounter, oddOrEven, upperCase });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with handlers object', (done) => {
    store.register({ mo });

    let subscriber = () => {
      let state = store.getState();
      let { increments, decrements } = state.mo;
      if (increments.num === 3 && decrements.num === -2 && increments.count === 3 && decrements.count === 2) {
        store.unsubscribe(subscriber);
        store.unregister({ mo });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with handlers object [with Promise]', (done) => {
    store.register({ mop });

    let subscriber = () => {
      let state = store.getState();
      let { increments, pDecrements } = state.mop;
      if (increments.num === 3 && pDecrements.num === -2 && increments.count === 3 && pDecrements.count === 2) {
        store.unsubscribe(subscriber);
        store.unregister({ mop });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with handlers object [with waitFor]', (done) => {
    store.register({ counter, mow });

    let subscriber = () => {
      let state = store.getState();
      let { wIncrements, decrements } = state.mow;
      if (wIncrements.num === 3 && decrements.num === -2 && wIncrements.count === 3 && decrements.count === 2) {
        store.unsubscribe(subscriber);
        store.unregister({ counter, mow });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with handlers object [with Promise and waitFor]', (done) => {
    store.register({ counter, mopw });

    let subscriber = () => {
      let state = store.getState();
      let { wIncrements, pDecrements } = state.mopw;
      if (wIncrements.num === 3 && pDecrements.num === -2 && wIncrements.count === 3 && pDecrements.count === 2) {
        store.unsubscribe(subscriber);
        store.unregister({ counter, mopw });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with array of handler[Object]', (done) => {
    store.register({ ma });

    let subscriber = () => {
      let state = store.getState();
      let { num, count } = state.ma;
      if (num === 1 && count === 5) {
        store.unsubscribe(subscriber);
        store.unregister({ ma });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with array of handler[Object] [with Promise]', (done) => {
    store.register({ map });

    let subscriber = () => {
      let state = store.getState();
      let { num, count } = state.map;
      if (num === 1 && count === 5) {
        store.unsubscribe(subscriber);
        store.unregister({ map });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with array of handler[Object] [with waitFor]', (done) => {
    store.register({ counter, maw });

    let subscriber = () => {
      let state = store.getState();
      let { num, count } = state.maw;
      if (num === 1 && count === 5) {
        store.unsubscribe(subscriber);
        store.unregister({ counter, maw });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('merge handlers with array of handler[Object] [with Promise and waitFor]', (done) => {
    store.register({ counter, mapw });

    let subscriber = () => {
      let state = store.getState();
      let { num, count } = state.mapw;
      if (num === 1 && count === 5) {
        store.unsubscribe(subscriber);
        store.unregister({ counter, mapw });
        done();
      }
    };

    store.subscribe(subscriber);

    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
    store.dispatch({ actionType: DECREMENTS });
    store.dispatch({ actionType: INCREMENTS });
  });
  it('error test', (done) => {
    store.register({ errorHandler });

    let subscriber = () => { /* ..do anything */ };
    store.subscribe(subscriber);

    store.onError(() => {
      store.unregister({ errorHandler });
      done();
    });

    store.dispatch({ actionType: ERROR });
  });
  it('unregister handlers', () => {
    assert.equal(store.handlers.size, 0);
  });
});
