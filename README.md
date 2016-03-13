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

### waitFor

FlakeStore supports `waitFor` to wait dependency handlers

**waitFor(handlerNames, callback)**

- handlerNames [String|Array[String]]
- callback [Function(state, dependencies)]
  - state: self state [Any]
  - dependencies: dependencies state [Array[Object]]

```javascript
import { waitFor } from 'flakestore';

let oddOrEven = (state = 0, action) => {
  switch (action.actionType) {
    case INCREMENTS:
    case DECREMENTS:
      return waitFor('counter', (state, dependencies) => {
        // The second arguments is passed the state that depends on oddOrEven.
        return dependencies.counter % 2 === 0 ? 'even': 'odd';
      });
    default:
      return state;
  }
}

store.register({ counter, oddOrEven });

store.dispatch({ actionType: INCREMENTS }); // { counter: 1, oddOrEven: 'odd' }
store.dispatch({ actionType: DECREMENTS }); // { counter: 0, oddOrEven: 'even' }
store.dispatch({ actionType: INCREMENTS }); // { counter: 1, oddOrEven: 'odd' }
store.dispatch({ actionType: INCREMENTS }); // { counter: 2, oddOrEven: 'even' }
store.dispatch({ actionType: INCREMENTS }); // { counter: 3, oddOrEven: 'odd' }
```

### merge handlers

`mergeHandlers` supports type either array of handler[Object] or object handlers.  
handler[Object] is the handler which return the state has type of Object.

**mergeHandlers(handlers)**

- handlers [Array[Handler[Object]]|Object{String:Handler}]

```javascript
import { mergeHandlers } from 'flakestore';

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

let mergedObject = mergeHandlers({ increments, decrements });
let mergedArray = mergeHandlers([ increments, decrements ]);

store.register({ mergedObject });

store.dispatch({ actionType: INCREMENTS }); // { mergedObject: { increments: { num: 1, count: 1 }, decrements: { num: 0, count: 0 } } }
store.dispatch({ actionType: INCREMENTS }); // { mergedObject: { increments: { num: 2, count: 2 }, decrements: { num: 0, count: 0 } } }
store.dispatch({ actionType: INCREMENTS }); // { mergedObject: { increments: { num: 3, count: 3 }, decrements: { num: 0, count: 0 } } }
store.dispatch({ actionType: DECREMENTS }); // { mergedObject: { increments: { num: 3, count: 3 }, decrements: { num: -1, count: 1 } } }
store.dispatch({ actionType: DECREMENTS }); // { mergedObject: { increments: { num: 3, count: 3 }, decrements: { num: -2, count: 2 } } }

store.unregister({ mergedObject });

store.register({ mergedArray });

store.dispatch({ actionType: INCREMENTS }); // { mergedArray: { num: 1, count: 1 } }
store.dispatch({ actionType: INCREMENTS }); // { mergedArray: { num: 2, count: 2 } }
store.dispatch({ actionType: INCREMENTS }); // { mergedArray: { num: 3, count: 3 } }
store.dispatch({ actionType: DECREMENTS }); // { mergedArray: { num: 2, count: 4 } }
store.dispatch({ actionType: DECREMENTS }); // { mergedArray: { num: 1, count: 5 } }

store.unregister({ mergedArray });
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
