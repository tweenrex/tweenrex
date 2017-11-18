
# interpolate()
A helper function that makes interpolating between two or more values simple.  It is built to work seamlessly with [TyrannoScrollus](./TyrannoScrollus.md)  and [TweenRex](./TweenRex.md) .

## Getting Started
Install the ```@tweenrex/render``` package and import the ```interpolate``` function.
```js
import { interpolate } from '@tweenrex/render'
```

## Usage

### A Simple Fade Out

```js
import { TweenRex } from '@tweenrex/core'
import { interpolate } from '@tweenrex/render'
import { easeOut } from 'just-curves' // external easing library

const tween = TweenRex({
    duration: 1000,
    easing: easeOut,
    subscribe: interpolate({
        targets: '#target',
        opacity: 0
    })
})

tween.play()
```

```#target``` is resolved to an element in the DOM.  Because ```opacity``` is a simple value (and not an array), the starting value of 1 is taken from the target and the value of 0 is used as the ending value. ```interpolate``` has special logic for HTMLElements that allow it to automatically decide if properties are attributes like ```disabled```, style properties like ```opacity```, or regular object properties such as ```innerHTML```.  In this example we included an easing from the just-curves easing library to make the animation look better.

### Updating a Timer

```js
import { TweenRex } from '@tweenrex/core'
import { interpolate } from '@tweenrex/render'

const myObject = {
    timeElapsed: 0
}

const timer = TweenRex({
    duration: 60000,
    subscribe: interpolate({
        targets: myObject,
        timeElapsed: [0, 60]
    })
})

timer.play()
```


In the example, ```myObject``` is the target of the tween.  ```The timeElapsed``` property is interpolated from ```0``` to ```60``` in 60 seconds.  Because ```timeElapsed``` is an array of values, ```interpolate``` will use the first value as the starting value and the second value in the array as the ending value.

### Slide In With a Text Change

```js
import { TweenRex } from '@tweenrex/core'
import { interpolate } from '@tweenrex/render'
import { easeIn } from 'just-curves' // external easing library

const tween = TweenRex({
    duration: 1000,
    subscribe: interpolate({
        targets: '#target',
        transform: {
            value: ['translateX(-200px)', 'translateX(0px)'],
            easing: easeIn
        },
        innerHTML: {
            value: ['First Half', 'Second Half'],
            type: 'discrete'
        }
    })
})

tween.play()
```

In this example, ```#target``` slides in from the left by interpolating the ```transform``` property from ```translateX(-200px)``` to ```translateX(0px)```.  ```interpolate``` automatically detects the structure of the values and interpolates between them.  In order to switch the text of ```innerHTML``` from 'First Half' to 'Second Half', the ```type``` property is used to inform ```interpolate``` that the values provided are discrete values that swap midway rather than continous values like numbers and colors.

> NOTE: ```interpolate``` requires all values to be structurally similar.  That is, all values must be formatted the same with the same units. i.e. rgb() is only compatible with rgb(), hsla() is only compatible with hsla(), and px is only compatible with px.

>NOTE: A special interpolate function for SVG/HTML ```transform``` is planned to be built because combining rotate, translate, skew, etc. in a straightforward manner requires special logic outside of the scope of what ```interpolate``` is designed to do.

## Options
Name | Type | Description |
--- | --- | --- |
targets | string, {}, [] | Target(s) of the animation.  This can be an object of any type or an array of various objects. If a string is supplied, it will be used as a DOM selector and the resolved Elements will become the targets of the tween. |
easing | (offset): number | An easing function to be applied to this interpolator |
secondary | (offset, render): void | A secondary motion or effect.  This intercepts the rendering of values in the interpolator.  It is meant to be used for asynchonrous easings to create secondary motions. |
(tween property) | any, [], Tween Property Options | A property to tween.  If a primitive value like a string or number are provided, this will detect the current value of the property on the target and transition to this value.  If an array is specified, the values will be uses as equidistant keyframes.  If an object is specified, the ```value``` property on that object will be used as the keyframes. See **Tween Property Options** |

### Tween Property Options

Name | Type | Description |
--- | --- | --- |
value| string, number, [] | Value(s) to use for tweening |
easing | (offset): number | An optional easing function to be applied to this property |
type| string | An optional interpolation type.  This option enforces one of three types: ```number```, ```discrete```, ```terms```. Number provides continuous values between numbers.  Discrete switches at the midpoint between values.  Terms splits the tring into an array of number and discrete values and interpolates between them.  Both sides must be structurally compatible when terms is used.  For instance, HSL colors must be interpolated to HSL colors and point arrays must have the same number of terms on both sides. This is an advanced feature.|
format| (value): any | This function overrides the format function that transforms the property's mixed value into what is assigned to the target.  For instance, translating 5 to 5px. This is an advanced feature. |
mix | (a, b, offset): any | This function overrides the mix function that interpolates between value a and b at the given offset.  This is an advanced feature.  |
