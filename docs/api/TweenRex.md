
# TweenRex
Tweens over a period of time with playback controls.  TweenRex is intentional very generic and can be used to tween dom objects, Three.js objects, etc.  It can even be used to tween the Web Animation API.


## Usage
```js
// get your target
const target = document.querySelector('#target')

// create an observable
const t1 = TweenRex({
    // tween for 1000ms or 1 second
    duration: 1000,

    // subscribe to changes in the offset
    // offset is 0 and 1 representing 0% to 100% of time
    subscribe(offset) {

        // tween from 0px to 200px
        target.style.left = (200 * offset) + 'px'
    }
})

// use playback controls to tween
t1.play()
```

### Options
Name | Description |
--- | --- |
distinct | When true, subsequent values will be ignored if they are the same as the previous value.  The default is true. |
duration | The duration of the tween in milliseconds |
easing | Eases subscribe by a function. |
frameSize | Enforces a fixed amount of time per frame.  If ```0```, Tweens will use actual deltas and attempt to sync to requestAnimationFrame.  The default value is ```0```. |
labels | A dictionary of named times used for seeking |
onDispose| Triggered by calling dispose() |
onNext| Triggered by calling next() |
onSubscribe| Triggered by calling subscribe() |
onUnsubscribe| Triggered by unsubscribing |
subscribe | Subscribes to changes in the value.  The value provided is a number between 0 and 1 representing 0% to 100% of time elapsed.  This can be either a function or an array of functions. |
timer | The observable that provides new time deltas.  If ```undefined```, the Tween will use a default timer.  The default value is ```undefined```.  |

## Properties
Name | Description |
--- | --- |
currentTime | The current time of the Tween |
duration | The total duration of the Tween |
easing | Eases subscribe by a function. |
isPlaying | If true, TweenRex is actively playing |
labels | A dictionary of named times used for seeking |
playbackRate | The rate at which the Tween is playing. The default value is 1 meaning 100% speed. |

## Tween Configuration

### ```subscribe(observer | observer[])```
Subscribes the observer to changes in the value.  The value provided is a number between 0 and 1 representing 0% to 100% of time elapsed.  This value can be passed to renderer functions such as the ones [Polymorph](https://github.com/notoriousb1t/polymorph) provides.

```js
var tween = TweenRex({ duration: 1000 })
var target = document.querySelector('#target')
var svgRenderer = polymorph.interpolate(['#first path', '#second path'])

tween.subscribe(o => {
    target.setAttribute('d', svgRenderer(o))
});

tween.play();
```

This returns a function that can be used to unsubscribe:

```js
var tween = new TweenRex(...)
var unsubscribe = tween.subscribe([
    o => /* 1st observer */,
    o => /* 2nd observer */
]);

// call unsubscribe
unsubscribe();
```

You can pass in an array of functions  or a single function.  If there isn't a need to remove subscriptions, you can provide the subscriptions upon initialization instead for more concise code:

```js
var target = document.querySelector('#target')
var svgRenderer = polymorph.interpolate(['#first path', '#second path'])

var tween = TweenRex({
    duration: 1000 ,
    subscribe: o => {
        target.setAttribute('d', svgRenderer(o))
    }
})

tween.play();
```

### ```dispose()```
Removes all subscriptions and resets the internal state.

## Labels

### ```getLabel(name)```
Gets the time for a label.

### ```setLabel(name, time)```
Sets a label at the time specified.  Set to undefined to clear the label.  These labels can be seeked to or used during add().


## Player Controls

### ```play()```
Starts tweening until the duration is reached.

### ```pause()```
Pauses the tween.

### ```reverse()```
Flips the playbackRate to the opposite direction.

### ```seek(timeOrLabel)```
Seeks to the time or label.  If the resolved time is not within the range of the tween, it will be clamped to either ```0``` or the ```duration```.

## Group Tweens and Sequences ```add()```

### add(tweens, options?)

#### Usage
The ```add()``` function allows a TweenRex to become a timeline for other instances.  The first argument, ```tweens``` can either be a TweenRex instance or an array of TweenRex instances.   If the argument is not a TweenRex instance, it will be used as options to create one. For this reason, the folllowing pieces of code are equivalent:

*With TweenRex instances*
```js
// create timeline
const timeline = TweenRex()

// add two tweens. The max time is extended to 1000
timeline.add([
    TweenRex({
        duration: 500,
        subscribe: o => ...
    }),
    TweenRex({
        duration: 1000,
        subscribe: o => ...
    })
])

// add an additional tween 750ms past the time and store the subscription
const sub = timeline.add(TweenRex({
    duration: 750,
    subscribe: o => ...
}))

...

// remove the 750ms tween from the timeline
sub()
```

*With TweenRex omitted*
```js
// create timeline
const timeline = TweenRex()

// add two tweens. The max time is extended to 1000
timeline.add([
    {
        duration: 500,
        subscribe: o => ...
    },
    {
        duration: 1000,
        subscribe: o => ...
    }
])

// add an additional tween 750ms past the time and store the subscription
const sub = timeline.add({
    duration: 750,
    subscribe: o => ...
})

...

// remove the 750ms tween from the timeline
sub()
```

When a TweenRex becomes a timeline, it automatically uses the last position as the duration so that all tweens fit inside of it.  The timeline will also shrink when sub-tweens are removed.  This shrinking can be prevented by setting the duration property of the timeline explicitly.

#### Options

Name | Description |
--- | --- |
position | Time or label at which to start these sub-tweens. Leave unset or undefined to use the last known position (duration) of the array |
sequence | True if the array of tweens should be treated as a sequence. False if the array of tweens should be treated as a group tween.  Default value is false. |
stagger | Number of additional milliseconds to add to each subsequent item.  With sequence = false, this creates an offset between each item that is visually appealing.  With sequence = true, you can use a negative number here to overlap items in the sequence. |

