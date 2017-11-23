
# TRexObservable
A simple observable and the base class for [TweenRex](./TweenRex.md) and [TyrannoScrollus](./TyrannoScrollus.md).  This is the best choice for animation when the animation greatly varies based on user input such as following mousement. For time-based animation use TweenRex.  For scroll-synced animations, use TyrannoScrollus.

## Getting Started
Install the ```@tweenrex/core``` package and import the ```TRexObservable``` function.
```js
import { TRexObservable } from '@tweenrex/core'
```

## Usage
Writing your typical foo-bar example

```js
// get your target
const obs = TRexObservable({
    subscribe: o => {
        // log whatever gets passed to .next()
        console.log(o)
    }
})

for (let i = 1; i < 30; i++) {
    if (i % 3) {
        // foo for multiples of 3
        obs.next('foo')
    }
    if (i % 5) {
        // bar for multiples of 5
        obs.next('bar')
    }
}
```

Listening to events
```js
const observable = TRexObservable({
    subscribe: evt => {
        // fires each time mousemove is fired
    }
})

// native DOM event listener
document.body.addEventListener('mousemove', observable.next)

// or jQuery events
$('body').on('mousemove', observable.next)
```

### Options
Name | Description |
--- | --- |
distinct | When true, subsequent values will be ignored if they are the same as the previous value.  The default is true. |
onDispose| Triggered by calling dispose() |
onNext| Triggered by calling next() |
onSubscribe| Triggered by calling subscribe() |
onUnsubscribe| Triggered by unsubscribing |
subscribe | Subscribes to changes in the value. |

## Observable Functions

### ```dispose()```
Removes all subscriptions and resets the internal state.

### ```next(value)```
Passes the next value to be observed

### ```subscribe(observer | observer[])```
Subscribes the observer to changes in the value.  This can be any value including strings and full objects.

You can pass in an array of functions or a single function.  If there isn't a need to remove subscriptions, you can specify a subscribe property like the examples above.

### ```value()```
Returns the last value observed
