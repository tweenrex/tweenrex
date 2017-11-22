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
        var duration = self.duration;
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
        if (isFinished && self._opts.onFinish) {
            self._opts.onFinish();
        }
        var tweens = self._tweens;
        self.next(offset);
        if (tweens) {
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

var global = window;
global.TRexObservable = TRexObservable;
global.TyrannoScrollus = TyrannoScrollus;
global.TweenRex = TweenRex;

}());
