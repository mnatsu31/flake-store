# flakestore

[![npm version](https://badge.fury.io/js/flakestore.svg)](https://badge.fury.io/js/flakestore)

simple flux store implementation

## Install

```
npm install --save flakestore
```

## Example

### sync flow

```javascript
import FlakeStore from 'flakestore';

const store = new FlakeStore();

const INIT = 'INIT';
const INCREMENTS = 'INCREMENTS';
const DECREMENTS = 'DECREMENTS';

// handler (inspired by reducer)
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

// register handlers (pass handlers object)
// when register handlers, these handlers are initialized
store.register({ counter }); // { counter: 0 }

// subscribe to change state
store.subscribe(() => {
  let state = store.getState();
  // do something...
});

store.dispatch({ actionType: INCREMENTS }); // { counter: 1 }
store.dispatch({ actionType: INCREMENTS }); // { counter: 2 }
store.dispatch({ actionType: DECREMENTS }); // { counter: 1 }
store.dispatch({ actionType: INCREMENTS }); // { counter: 2 }
store.dispatch({ actionType: INCREMENTS }); // { counter: 3 }
```

### async flow

```javascript
// handler (inspired by reducer)
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

// register handlers (pass handlers object)
// when register handlers, these handlers are initialized
store.register({ asyncCounter }); // { asyncCounter: 0 }

// subscribe to change state
store.subscribe(() => {
  let state = store.getState();
  // do something...
});

store.dispatch({ actionType: INCREMENTS }); // { asyncCounter: 1 }
store.dispatch({ actionType: INCREMENTS }); // { asyncCounter: 2 }
store.dispatch({ actionType: DECREMENTS }); // { asyncCounter: 1 }
store.dispatch({ actionType: INCREMENTS }); // { asyncCounter: 2 }
store.dispatch({ actionType: INCREMENTS }); // { asyncCounter: 3 }
```

### handling initialization

The register method returns `Promise`, so you can call `then` and handle initialization.

```javascript
store.register(handlers)
  .then((initialState) => {
    // do something...
  });
```

### handling error

`onError` is called if handlers throw exception while updating state.

```javascript
store.onError((err) => {
  // do something
});
```

### unregister handler

register and unregister are same syntax.

```javascript
let exhandler = (state = 0, action) => { /* ... */ };

store.register({ exhandler });   // registered!
store.unregister({ exhandler }); // unregistered!
```
