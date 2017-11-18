(function () {
'use strict';

function addAll(target, subarray) {
    target.push.apply(target, subarray);
}
function removeAll(target, subarray) {
    for (var i = 0; i < subarray.length; i++) {
        var index = target.indexOf(subarray[i]);
        if (index !== -1) {
            target.splice(index, 1);
        }
    }
}
function toArray(t) {
    return Array.isArray(t) ? t : [t];
}

var noOperation = function () { };

function TRexObservable(options) {
    options = options || {};
    var distinct = options.distinct !== false;
    var onNext = options.onNext || noOperation;
    var onDispose = options.onDispose || noOperation;
    var onSubscribe = options.onSubscribe || noOperation;
    var onUnsubscribe = options.onUnsubscribe || noOperation;
    var subs = toArray(options.subscribe || []);
    var c;
    var buffer;
    return {
        dispose: function () {
            subs.length = 0;
            onDispose();
        },
        next: function (n) {
            if (!buffer) {
                buffer = [];
            }
            buffer.push(n);
            if (buffer.length > 1) {
                return;
            }
            for (var h = 0; h < buffer.length; h++) {
                var subs2 = subs.slice();
                var n_1 = buffer[h];
                if (!distinct || n_1 !== c) {
                    c = n_1;
                    for (var i = 0; i < subs2.length; i++) {
                        subs2[i](n_1);
                    }
                }
            }
            buffer.length = 0;
            onNext(n, subs);
        },
        subscribe: function (fn) {
            fn = toArray(fn);
            onSubscribe(subs);
            addAll(subs, fn);
            return function () {
                removeAll(subs, fn);
                onUnsubscribe(subs);
            };
        }
    };
}

var _ = undefined;

function newify(self, type) {
    return self instanceof type ? self : Object.create(type.prototype);
}

var onNextFrame = typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : function (fn) { return setTimeout(function () { return fn(Date.now()); }, 1000 / 60); };

var defaultTimer = TRexObservable({
    onSubscribe: function (subs) {
        if (!subs.length) {
            onNextFrame(defaultTimer.next);
        }
    },
    onNext: function (value, subs) {
        if (subs.length) {
            onNextFrame(defaultTimer.next);
        }
    }
});

function isString(val) {
    return typeof val === 'string';
}

function resolveTarget(target) {
    return isString(target.tagName) ? target : document.querySelector(target);
}

function TyrannoScrollus(options) {
    var self = newify(this, TyrannoScrollus);
    self._opts = options;
    self.target = resolveTarget(options.targets);
    self._timer = options.timer || defaultTimer;
    self.easing = options.easing;
    self.direction = options.direction;
    self._tick = function () {
        var target = self.target;
        var value = self.direction === 'x'
            ? target.scrollLeft / (target.scrollWidth - target.clientWidth)
            : target.scrollTop / (target.scrollHeight - target.clientHeight);
        if (self.easing) {
            value = self.easing(value);
        }
        self.next(value);
    };
    var obs = TRexObservable(options);
    self.next = obs.next;
    self.subscribe = obs.subscribe;
    self.dispose = function () {
        self.pause();
        self.target = _;
        obs.dispose();
    };
    return self;
}
TyrannoScrollus.prototype = {
    get isPlaying() {
        return !!this._sub;
    },
    play: function () {
        var self = this;
        if (!self.isPlaying) {
            self._tick();
            self._sub = self._timer.subscribe(self._tick);
            if (self._opts.onPlay) {
                self._opts.onPlay();
            }
        }
    },
    pause: function () {
        var self = this;
        if (self.isPlaying) {
            self._sub();
            self._sub = _;
            if (self._opts.onPause) {
                self._opts.onPause();
            }
        }
    }
};

function minMax(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

function coalesce(current, fallback) {
    return current === _ ? fallback : current;
}

function TweenRex(opts) {
    var options = (opts || {});
    var self = newify(this, TweenRex);
    self._opts = options;
    self._timer = options.timer || defaultTimer;
    self._pos = options.duration || 0;
    self._time = 0;
    self.labels = options.labels || {};
    self.easing = options.easing;
    self.playbackRate = 1;
    self._tick = function (timestamp) {
        var delta = options.frameSize || (timestamp - (self._last || timestamp)) * self.playbackRate;
        var n = self._time + delta;
        self._last = timestamp;
        self.seek(n);
    };
    var obs = TRexObservable(options);
    self.dispose = function () {
        self.pause();
        self._pos = 0;
        self._time = 0;
        self.playbackRate = 1;
        self._tweens = _;
        self.labels = {};
        obs.dispose();
    };
    self.next = obs.next;
    self.subscribe = obs.subscribe;
    return self;
}
TweenRex.prototype = {
    get duration() {
        var self = this;
        var tweens = self._tweens;
        var maxSize = self._pos;
        if (tweens) {
            for (var i = 0, ilen = tweens.length; i < ilen; i++) {
                var t = tweens[i];
                var size = t.pos + t.tween.duration;
                if (maxSize < size) {
                    maxSize = size;
                }
            }
        }
        return maxSize;
    },
    set duration(value) {
        this._pos = value;
    },
    get currentTime() {
        return this._time;
    },
    set currentTime(time) {
        this.seek(time);
    },
    get isPlaying() {
        return !!this._sub;
    },
    add: function (tweens, opts) {
        var self = this;
        if (!self._tweens) {
            self._tweens = [];
        }
        tweens = toArray(tweens);
        var _tweens = self._tweens;
        opts = opts || {};
        var pos = coalesce(isString(opts.position) ? self.labels[opts.position] : opts.position, self.duration);
        var seq = opts.sequence;
        var stagger = opts.stagger;
        var ilen = tweens.length;
        var tweenObjs = Array(ilen);
        for (var i = 0; i < ilen; i++) {
            var tween = ensureTween(tweens[i]);
            if (tween.isPlaying) {
                tween.pause();
            }
            tween._timer = _;
            tweenObjs[i] = { pos: pos, tween: tween };
            if (seq) {
                pos += tween.duration;
            }
            if (stagger) {
                pos += stagger;
            }
        }
        addAll(_tweens, tweenObjs);
        return function () {
            removeAll(_tweens, tweenObjs);
        };
    },
    play: function () {
        var self = this;
        var timer = self._timer;
        if (timer && !self.isPlaying) {
            var isForwards = self.playbackRate >= 0;
            var duration = self.duration;
            var n = self._time;
            if (isForwards && n >= duration) {
                n = 0;
            }
            else if (!isForwards && n <= 0) {
                n = duration;
            }
            self.seek(n);
            self._sub = timer.subscribe(self._tick);
            if (self._opts.onPlay) {
                self._opts.onPlay();
            }
        }
        return self;
    },
    restart: function () {
        var self = this;
        return self
            .pause()
            .seek(self.playbackRate >= 0 ? 0 : self.duration)
            .play();
    },
    pause: function () {
        var self = this;
        var sub = self._sub;
        if (sub) {
            sub();
            self._sub = self._last = _;
            if (self._opts.onPause) {
                self._opts.onPause();
            }
        }
        return self;
    },
    reverse: function () {
        this.playbackRate *= -1;
        return this;
    },
    seek: function (n) {
        var self = this;
        var isForwards = self.playbackRate >= 0;
        var duration = self.duration;
        var tweens = self._tweens;
        var c = isString(n) ? self.labels[n] : n;
        var isFinished;
        if (isForwards && c >= duration) {
            c = duration;
            self.pause();
            isFinished = true;
        }
        else if (!isForwards && c <= 0) {
            c = 0;
            self.pause();
            isFinished = true;
        }
        self._time = c;
        var offset = c / (duration || 1);
        if (self.easing) {
            offset = self.easing(offset);
        }
        self.next(offset);
        if (tweens) {
            for (var i = 0, ilen = tweens.length; i < ilen; i++) {
                var t = tweens[i];
                var tween = t.tween;
                var startPos = t.pos;
                var endPos = startPos + (tween.duration || 1);
                var offset_1 = minMax((c - startPos) / (endPos - startPos), 0, 1);
                tween.next(offset_1);
            }
        }
        if (isFinished && self._opts.onFinish) {
            self._opts.onFinish();
        }
        return self;
    },
    getLabel: function (name) {
        return this.labels[name];
    },
    setLabel: function (name, time) {
        this.labels[name] = time;
        return this;
    }
};
function ensureTween(opts) {
    return opts instanceof TweenRex ? opts : TweenRex(opts);
}

var global = window;
global.TRexObservable = TRexObservable;
global.TyrannoScrollus = TyrannoScrollus;
global.TweenRex = TweenRex;

var math = Math;
var min = math.min;
var max = math.max;
var round = math.round;
var sqrt = math.sqrt;
function minMax$1(val, lower, upper) {
    return max(lower, min(upper, val));
}

var cssVarExp = /^\-\-[a-z0-9\-]+$/i;



var _$1 = undefined;
var sq255 = 65025;

function isDOM(target) {
    return target instanceof Element;
}
function isNumber(obj) {
    return typeof obj === 'number';
}
function isString$1(obj) {
    return typeof obj === 'string';
}
function isNumeric(obj) {
    return isNumber(obj) || /^\-?\d*\.?\d+$/.test(obj);
}
function isDefined(obj) {
    return obj !== _$1;
}

var attrs = {
    get: function (target, prop) {
        target.getAttribute(name);
    },
    set: function (target, name, value) {
        target.setAttribute(name, value);
    }
};
var props = {
    get: function (target, name) {
        return target[name];
    },
    set: function (target, name, value) {
        target[name] = value;
    }
};
var vars = {
    get: function (target, name) {
        target.style.getPropertyValue(name);
    },
    set: function (target, name, value) {
        target.style.setProperty(name, value ? value + '' : '');
    }
};
var styles = {
    get: function (target, prop) {
        return target.style[prop];
    },
    set: function (target, name, value) {
        target.style[name] = value;
    }
};
function getTargetAdapter(target, prop) {
    if (!isDOM(target)) {
        return props;
    }
    var el = target;
    if (cssVarExp.test(prop)) {
        return vars;
    }
    if (typeof el.style[prop] !== 'undefined') {
        return styles;
    }
    if (el.hasAttribute(prop)) {
        return attrs;
    }
    return props;
}

var isArray = Array.isArray;
function pushAll(a, b) {
    a.push.apply(a, b);
}

function resolve(targets) {
    var results = [];
    resolveInner(targets, results);
    return results;
}
function resolveInner(targets, results) {
    if (isArray(targets)) {
        targets.forEach(function (target) { return resolveInner(target, results); });
    }
    else if (typeof targets === 'string') {
        pushAll(results, document.querySelectorAll(targets));
    }
    else {
        results.push(targets);
    }
}

function parse(value, type) {
    if (!type) {
        if (isNumeric(value)) {
            type = 'number';
        }
        else if (isString$1(value) && /\d*/.test(value)) {
            type = 'terms';
        }
    }
    switch (type) {
        case 'number':
            return parseNumber(value);
        case 'terms':
            value = convertHexToRGB(value);
            return parseTerms(value);
        default:
            return parseDiscrete(value);
    }
}
function parseNumber(value) {
    return {
        value: +value,
        mix: mixNumber,
        format: formatNumber
    };
}
function parseTerms(value) {
    var exp = /\s*([a-z]+\-?[a-z]*|%|\-?\d*\.?\d+\s*|,+?|\(|\))\s*/gi;
    var terms = value
        .replace(exp, ' $1')
        .trim()
        .split(' ')
        .map(function (v) { return (isNumeric(v) ? parseFloat(v) : v.trim()); })
        .filter(function (v) { return v !== ''; });
    return {
        value: terms,
        mix: mixTerms,
        format: formatTerms
    };
}
function parseDiscrete(value) {
    return {
        value: value,
        mix: mixDiscrete,
        format: undefined
    };
}
function convertHexToRGB(stringValue) {
    var hexRegex$$1 = /#(([a-f0-9]{6})|([a-f0-9]{3}))$/i;
    var match = stringValue.match(hexRegex$$1);
    if (!match) {
        return stringValue;
    }
    var hex = match[1];
    var hexColor = parseInt(hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : hex, 16);
    var r = (hexColor >> 16) & 0xff;
    var g = (hexColor >> 8) & 0xff;
    var b = hexColor & 0xff;
    return "rgb(" + r + "," + g + "," + b + ")";
}
function formatTerms(aTerms) {
    var num = 1;
    var punct = 2;
    var word = 3;
    var result = '';
    var lastType;
    for (var i = 0; i < aTerms.length; i++) {
        var term = aTerms[i];
        var type = isNumber(term) ? num : /^[\(\),]$/i.test(term) ? punct : word;
        if (lastType && lastType === type && type !== punct) {
            result += ' ';
        }
        result += term;
        lastType = type;
    }
    return result;
}
function formatNumber(a) {
    return a.toString();
}
function mixNumber(a, b, o) {
    return a + (b - a) * o;
}
function mixDiscrete(a, b, o) {
    return o < 0.5 ? a : b;
}
function mixTerms(aTerms, bTerms, o) {
    var ilen = Math.min(aTerms.length, bTerms.length);
    var result = Array(ilen);
    var rgbLocked = 0;
    for (var i = 0; i < ilen; i++) {
        var a = aTerms[i];
        var b = bTerms[i];
        var numeric = isNumber(a);
        var value = void 0;
        if (numeric) {
            if (rgbLocked) {
                value = round(sqrt(minMax$1(mixNumber(a * a, b * b, o), 0, sq255)));
                rgbLocked--;
            }
            else {
                value = mixNumber(a, b, o);
            }
        }
        else {
            value = mixDiscrete(a, b, o);
        }
        if (a === 'rgb' || a === 'rgba') {
            rgbLocked = 3;
        }
        result[i] = value;
    }
    return result;
}

var optionNames = ['targets', 'secondary', 'easing'];
function renderer(ro) {
    var parse$$1 = ro.parse || parse;
    var getTarget = ro.getTarget || getTargetAdapter;
    return function (opts) {
        var targets = resolve(opts.targets);
        var renderers = [];
        targets.forEach(function (target) {
            var _loop_1 = function (prop) {
                if (optionNames.indexOf(prop) !== -1) {
                    return "continue";
                }
                var targetAdapter = getTarget(target, prop);
                var value = opts[prop];
                var valueConfig = isDefined(value.value)
                    ? value
                    : { value: value };
                if (!isArray(valueConfig.value)) {
                    valueConfig.value = [targetAdapter.get(target, prop), valueConfig.value];
                }
                var ilen = valueConfig.value.length;
                var values = Array(ilen);
                for (var i = 0; i < ilen; i++) {
                    var r = valueConfig.value[i];
                    var parsed = parse$$1(r, valueConfig.type);
                    values[i] = parsed.value;
                    if (!valueConfig.mix) {
                        valueConfig.mix = parsed.mix;
                    }
                    if (!valueConfig.format) {
                        valueConfig.format = parsed.format;
                    }
                }
                var renderFn = function (offset) {
                    var total = values.length - 1;
                    var totalOffset = total * offset;
                    var stepStart = max(Math.floor(totalOffset), 0);
                    var stepEnd = min(stepStart + 1, total);
                    if (total === stepStart) {
                        stepStart--;
                    }
                    if (!stepEnd) {
                        stepEnd++;
                    }
                    var nextValue = valueConfig.mix(values[stepStart], values[stepEnd], totalOffset - stepStart);
                    if (valueConfig.format) {
                        nextValue = valueConfig.format(nextValue);
                    }
                    targetAdapter.set(target, prop, nextValue);
                };
                renderers.push(function (offset) {
                    if (valueConfig.easing) {
                        offset = valueConfig.easing(offset);
                    }
                    if (valueConfig.secondary) {
                        valueConfig.secondary(offset, renderFn);
                    }
                    else {
                        renderFn(offset);
                    }
                });
            };
            for (var prop in opts) {
                _loop_1(prop);
            }
            return renderers;
        });
        var rLen = renderers.length;
        var render = function (o) {
            for (var i = 0; i < rLen; i++) {
                renderers[i](o);
            }
        };
        return function (offset) {
            if (opts.easing) {
                offset = opts.easing(offset);
            }
            if (opts.secondary) {
                opts.secondary(offset, render);
            }
            else {
                render(offset);
            }
        };
    };
}

var interpolate = renderer({});

var global$1 = window;
var tweenrex = global$1.tweenrex || (global$1.tweenrex = {});
tweenrex.interpolate = interpolate;

}());
