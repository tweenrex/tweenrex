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
        value: function () {
            return c;
        },
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
                n = buffer[h];
                if (!distinct || n !== c) {
                    c = n;
                    for (var i = 0; i < subs2.length; i++) {
                        subs2[i](n);
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
    ? requestAnimationFrame.bind(window)
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

var math = Math;
var min = math.min;
var max = math.max;
function minMax(val, minVal, maxVal) {
    return min(max(minVal, val), maxVal);
}

function TyrannoScrollus(options) {
    var self = newify(this, TyrannoScrollus);
    self._opts = options;
    self.target = resolveTarget(options.targets);
    self._timer = options.timer || defaultTimer;
    self.startAt = options.startAt;
    self.endAt = options.endAt;
    self.easing = options.easing;
    self.direction = options.direction;
    self._tick = function () {
        var target = self.target;
        var scrollOffset, scrollStart, scrollEnd;
        if (self.direction === 'x') {
            scrollOffset = target.scrollLeft;
            scrollStart = self.startAt || 0;
            scrollEnd = self.endAt ? self.endAt : target.scrollWidth - target.clientWidth;
        }
        else {
            scrollOffset = target.scrollTop;
            scrollStart = self.startAt || 0;
            scrollEnd = self.endAt ? self.endAt : target.scrollHeight - target.clientHeight;
        }
        var value = minMax(!scrollEnd || !isFinite(scrollEnd) ? 0 : (scrollOffset - scrollStart) / (scrollEnd - scrollStart), 0, 1);
        if (!self.easing) {
            self.next(value);
        }
        else if (self.easing.tr_type === 'ASYNC') {
            self.easing(value, self.next);
        }
        else {
            self.next(self.easing(value));
        }
    };
    var obs = TRexObservable(options);
    self.next = obs.next;
    self.value = obs.value;
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
    self.value = obs.value;
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
        var wasPlaying = self.isPlaying;
        var duration = self.duration;
        var c = isString(n) ? self.labels[n] : n;
        var isAtEnd;
        if (isForwards && c >= duration) {
            c = duration;
            self.pause();
            isAtEnd = true;
        }
        else if (!isForwards && c <= 0) {
            c = 0;
            self.pause();
            isAtEnd = true;
        }
        self._time = c;
        var offset = c / (duration || 1);
        if (self.easing) {
            offset = self.easing(offset);
        }
        if (isAtEnd && wasPlaying && self._opts.onFinish) {
            self._opts.onFinish();
        }
        var isSeekingBackward = c < self.value();
        self.next(offset);
        var tweens = self._tweens;
        if (tweens) {
            var d_1 = duration - c;
            tweens.sort(function (a, b) { return ((d_1 + a.pos) % duration) - ((d_1 + b.pos) % duration); });
            if (isSeekingBackward) {
                tweens.reverse();
            }
            for (var i = 0, ilen = tweens.length; i < ilen; i++) {
                var t = tweens[i];
                var tween = t.tween;
                var startPos = t.pos;
                var endPos = startPos + (tween.duration || 1);
                var ro = minMax((c - startPos) / (endPos - startPos), 0, 1);
                tween.next(ro);
            }
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

var floatExp = /^(\-?\d+\.?\d{0,5})/;
var math$1 = Math;
var min$1 = math$1.min;
var atan = math$1.atan;
var atan2 = math$1.atan2;
var max$1 = math$1.max;
var round = math$1.round;
var sqrt = math$1.sqrt;
var floor = math$1.floor;
var degrees = 180 / math$1.PI;
function clamp(val, bottom, top) {
    return val < bottom ? bottom : val > top ? top : val;
}
function roundFloat(n) {
    return floatExp.exec(n.toString())[1];
}

var cssVarExp = /^\-\-[a-z0-9\-]+$/i;



var _$1 = undefined;
var sq255 = 65025;
var TARGETS = 'targets';
var EASING = 'easing';
var builtInRenderOptions = [TARGETS, EASING];

var isArray = Array.isArray;
function pushAll(a, b) {
    a.push.apply(a, b);
}

function renderer(ro) {
    return function (opts) {
        var targets = ro.getTargets(opts.targets);
        var props = Object.keys(opts).filter(isCustomProp);
        var configs = [];
        for (var t = 0, tlen = targets.length; t < tlen; t++) {
            pushAll(configs, ro.getEffects(targets[t], props, opts));
        }
        var renderers = configs.map(getRenderItem);
        if (opts.debug) {
            renderers.forEach(function (r) { return opts.debug(r.target, r.render); });
        }
        return getEasedFunction(opts, function (o) {
            for (var i = 0; i < renderers.length; i++) {
                var item = renderers[i];
                item.render(o, item.target);
            }
        });
    };
}
function getRenderItem(config) {
    var renderFn = getEasedFunction(config, function (offset, target2) {
        var total = config.value.length - 1;
        var totalOffset = total * offset;
        var stepStart = max$1(floor(totalOffset), 0);
        var stepEnd = min$1(stepStart + 1, total);
        if (total === stepStart) {
            stepStart--;
        }
        if (!stepEnd) {
            stepEnd++;
        }
        var nextValue = config.mix(config.value[stepStart], config.value[stepEnd], totalOffset - stepStart);
        if (config.format) {
            nextValue = config.format(nextValue);
        }
        config.set(target2, config.prop, nextValue);
    });
    return {
        render: renderFn,
        target: config.target
    };
}
function getEasedFunction(options, fn) {
    return function (offset, target2) {
        var easing = options.easing;
        if (!easing) {
            fn(offset, target2);
        }
        else if (easing.tr_type === 'ASYNC') {
            easing(offset, target2, fn);
        }
        else {
            fn(easing(offset), target2);
        }
    };
}
function isCustomProp(prop) {
    return builtInRenderOptions.indexOf(prop) === -1;
}

var w$1 = window;
function isDOM(target) {
    return target instanceof Element;
}
function isSVG(target) {
    return w$1.SVGElement && target instanceof w$1.SVGElement;
}
function isNumber(obj) {
    return typeof obj === 'number';
}
function isFunction(obj) {
    return typeof obj === 'function';
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

function resolveDomTargets(targets, results) {
    if (isArray(targets)) {
        for (var i = 0, ilen = targets.length; i < ilen; i++) {
            resolveDomTargets(targets[i], results);
        }
    }
    else if (isString$1(targets)) {
        pushAll(results, document.querySelectorAll(targets));
    }
    else {
        results.push(targets);
    }
}

function numberToString(a) {
    return a.toString();
}

function stringToTerms(value) {
    return value
        .replace(/\s*([a-z]+\-?[a-z]*|%|\-?\d*\.?\d+\s*|,+?|\(|\))\s*/gi, ' $1')
        .trim()
        .split(' ')
        .map(function (v) { return (isNumeric(v) ? parseFloat(v) : v.trim()); })
        .filter(function (v) { return v !== ''; });
}

function hexToRgb(stringValue) {
    var hexRegex = /#(([a-f0-9]{6})|([a-f0-9]{3}))$/i;
    var match = stringValue.match(hexRegex);
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

function termsToString(aTerms) {
    var NUM = 1;
    var PUNCT = 2;
    var WORD = 3;
    var result = '';
    var lastType;
    for (var i = 0; i < aTerms.length; i++) {
        var term = aTerms[i];
        var type = isNumber(term) ? NUM : /^[\(\),]$/i.test(term) ? PUNCT : WORD;
        if (lastType && lastType === type && type !== PUNCT) {
            result += ' ';
        }
        result += term;
        lastType = type;
    }
    return result;
}

var propertyAdapter = {
    get: function (target, name) {
        return target[name];
    },
    set: function (target, name, value) {
        target[name] = value;
    }
};

var attributeAdapter = {
    get: function (target, prop) {
        target.getAttribute(name);
    },
    set: function (target, name, value) {
        target.setAttribute(name, value);
    }
};

var cssVariableAdapter = {
    get: function (target, name) {
        target.style.getPropertyValue(name);
    },
    set: function (target, name, value) {
        target.style.setProperty(name, value ? value + '' : '');
    }
};

var styleAdapter = {
    get: function (target, prop) {
        return target.style[prop];
    },
    set: function (target, name, value) {
        target.style[name] = value;
    }
};

function mixNumber(a, b, o) {
    return a + (b - a) * o;
}

function mixDiscrete(a, b, o) {
    return o < 0.5 ? a : b;
}

function mixTerms(aTerms, bTerms, o) {
    var ilen = min$1(aTerms.length, bTerms.length);
    if (isNaN(ilen)) {
        console.log(aTerms, bTerms);
    }
    var result = Array(ilen);
    var rgbLocked = 0;
    for (var i = 0; i < ilen; i++) {
        var a = aTerms[i];
        var b = bTerms[i];
        var numeric = isNumber(a);
        var value = void 0;
        if (numeric) {
            if (rgbLocked) {
                value = round(sqrt(clamp(mixNumber(a * a, b * b, o), 0, sq255)));
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

var TERMS = 'terms';
var NUMBER = 'number';
var interpolate = renderer({
    getEffects: function (target, props, opts) {
        var effects = [];
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var value = opts[prop];
            var valueAsConfig = value;
            var effect = {
                target: target,
                prop: prop,
                value: []
            };
            var value2 = void 0;
            var type = void 0;
            if (isDefined(valueAsConfig.value)) {
                effect.easing = valueAsConfig.easing;
                effect.format = valueAsConfig.format;
                effect.mix = valueAsConfig.mix;
                type = valueAsConfig.type;
                value2 = valueAsConfig.value;
            }
            else {
                value2 = value;
            }
            var targetAdapter = getAdapter(target, prop);
            effect.set = effect.set || targetAdapter.set;
            if (!isArray(value2)) {
                effect.value = [targetAdapter.get(target, prop), value2];
            }
            else {
                effect.value = value2;
            }
            var ilen = effect.value.length;
            var values = Array(ilen);
            for (var j = 0; j < ilen; j++) {
                var r = effect.value[j];
                var parsed = parse(r, type);
                values[j] = parsed.value;
                if (!effect.mix) {
                    effect.mix = parsed.mix;
                }
                if (!effect.format) {
                    effect.format = parsed.format;
                }
            }
            effect.value = values;
            effects.push(effect);
        }
        return effects;
    },
    getTargets: function (targets) {
        var results = [];
        resolveDomTargets(targets, results);
        return results;
    }
});
function parse(value, type) {
    if (!type) {
        if (isNumeric(value)) {
            type = NUMBER;
        }
        else if (isString$1(value) && /\d*/.test(value)) {
            type = TERMS;
        }
    }
    if (type === NUMBER) {
        return {
            value: +value,
            mix: mixNumber,
            format: numberToString
        };
    }
    if (type === TERMS) {
        return {
            value: stringToTerms(hexToRgb(value)),
            mix: mixTerms,
            format: termsToString
        };
    }
    return {
        value: value,
        mix: mixDiscrete
    };
}
function getAdapter(target, prop) {
    if (!isDOM(target)) {
        return propertyAdapter;
    }
    var el = target;
    if (cssVarExp.test(prop)) {
        return cssVariableAdapter;
    }
    if (typeof el.style[prop] !== 'undefined') {
        return styleAdapter;
    }
    if (el.hasAttribute(prop)) {
        return attributeAdapter;
    }
    return propertyAdapter;
}

var matrix;
function decomposeMatrix(value) {
    if (!matrix) {
        var w = window;
        matrix = w.WebKitCSSMatrix || w.MSCSSMatrix || w.DOMMatrix;
    }
    var _a = new matrix(value), a = _a.a, b = _a.b, c = _a.c, d = _a.d, e = _a.e, f = _a.f;
    var scaleX = sqrt(a * a + b * b);
    if (scaleX) {
        a /= scaleX;
        b /= scaleX;
    }
    var skewX = a * c + b * d;
    if (skewX) {
        c -= a * skewX;
        d -= b * skewX;
    }
    var scaleY = sqrt(c * c + d * d);
    if (scaleY) {
        c /= scaleY;
        d /= scaleY;
        skewX /= scaleY;
    }
    if (a * d < b * c) {
        a = -a;
        b = -b;
        skewX = -skewX;
        scaleX = -scaleX;
    }
    return {
        rotate: atan2(b, a) * degrees,
        scaleX: scaleX,
        scaleY: scaleY,
        skewX: atan(skewX) * degrees,
        x: e,
        y: f
    };
}

var ops = [];
var frame;
function scheduler(fn) {
    return function () {
        ops.push(fn);
        frame = frame || setTimeout(forceTick, 0) || 1;
    };
}
function forceTick() {
    for (var i = 0; i < ops.length; i++) {
        ops[i]();
    }
    frame = ops.length = 0;
}

function observe(obj, onUpdate) {
    onUpdate = scheduler(onUpdate);
    var _loop_1 = function (name_1) {
        if (obj.hasOwnProperty(name_1) && !isFunction(obj[name_1])) {
            var _val_1 = obj[name_1];
            Object.defineProperty(obj, name_1, {
                get: function () {
                    return _val_1;
                },
                set: function (val) {
                    if (_val_1 !== val) {
                        _val_1 = val;
                        onUpdate();
                    }
                }
            });
        }
    };
    for (var name_1 in obj) {
        _loop_1(name_1);
    }
}

var passthru = function (t) { return t; };
var transform = renderer({
    getEffects: function (target, props, opts) {
        var adapter = propertyAdapter;
        var effects = [];
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var value = opts[prop];
            var valueAsConfig = value;
            var hasOptions = isDefined(valueAsConfig.value);
            var value2 = hasOptions ? valueAsConfig.value : value;
            effects.push({
                target: target,
                prop: prop,
                mix: mixNumber,
                format: passthru,
                set: adapter.set,
                value: isArray(value2) ? value : [adapter.get(target, prop), value2],
                easing: (hasOptions && valueAsConfig.easing) || passthru
            });
        }
        return effects;
    },
    getTargets: function (targets) {
        var results = [];
        resolveDomTargets(targets, results);
        return results.map(getTransformProxy);
    }
});
function getTransformProxy(el) {
    var isTargetSVG = isSVG(el);
    var adapter = isTargetSVG ? attributeAdapter : styleAdapter;
    var initial = adapter.get(el, 'transform');
    var target = decomposeMatrix(initial);
    Object.defineProperty(target, 'scale', {
        get: function () {
            return target.scaleX;
        },
        set: function (val) {
            target.scaleX = target.scaleY = val;
        }
    });
    var lUnit = '';
    var rUnit = '';
    if (!isTargetSVG) {
        lUnit = 'px';
        rUnit = 'deg';
    }
    var lastTransform;
    observe(target, function () {
        var val = '';
        if (target.x || target.y) {
            val += "translate(" + round(target.x) + lUnit + "," + round(target.y) + lUnit + ") ";
        }
        if (target.rotate) {
            val += "rotate(" + roundFloat(target.rotate) + rUnit + ") ";
        }
        if (target.skewX) {
            val += "skewX(" + roundFloat(target.skewX) + rUnit + ") ";
        }
        if (target.scaleX !== 1 || target.scaleY !== 1) {
            val += "scale(" + roundFloat(target.scaleX) + "," + roundFloat(target.scaleY) + ") ";
        }
        val = !val ? "translate(0" + lUnit + ")" : val.trim();
        if (lastTransform !== val) {
            el.style.transform = lastTransform = val;
        }
    });
    return target;
}

var w = window;
w.TRexObservable = TRexObservable;
w.TyrannoScrollus = TyrannoScrollus;
w.TweenRex = TweenRex;
var t = w.tweenrex || (w.tweenrex = {});
t.interpolate = interpolate;
t.transform = transform;

}());
