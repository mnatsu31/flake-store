# flakestore

simple flux store implementation

## Install

```
npm install --save flakestore
```

## Example

```javascript
import FlakeStore from '../';
import { Dispatcher } from 'flux';

const store = new FlakeStore(new Dispatcher());

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
