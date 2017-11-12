(function () {
'use strict';

var _ = undefined;

function newify(self, type) {
    return self instanceof type ? self : Object.create(type.prototype);
}

function inherit(a, b) {
    for (var k in b) {
        if (a[k] === _) {
            a[k] = b[k];
        }
    }
    return a;
}

function isString(val) {
    return typeof val === 'string';
}
var isArray = Array.isArray;

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

function TRexObservable(input) {
    var self = (input || {});
    var next = self.next && self.next.bind(self);
    var subs = (self.subs = []);
    var c;
    var buffer;
    self.next = function (n) {
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
            if (self.distinct && n_1 === c) {
                continue;
            }
            c = n_1;
            for (var i = 0; i < subs2.length; i++) {
                subs2[i](n_1);
            }
        }
        buffer.length = 0;
        if (next) {
            next(n);
        }
    };
    inherit(self, TRexObservable.prototype);
    return self;
}
TRexObservable.prototype = {
    subscribe: function (fn) {
        var self = this;
        var subs = self.subs;
        if (!isArray(fn)) {
            fn = [fn];
        }
        if (self.onSubscribe) {
            self.onSubscribe();
        }
        addAll(subs, fn);
        return function () {
            removeAll(subs, fn);
            if (self.onUnsubscribe) {
                self.onUnsubscribe();
            }
        };
    }
};

var onNextFrame = typeof window !== 'undefined'
    ? requestAnimationFrame
    : function (fn) { return setTimeout(function () { return fn(Date.now()); }, 1000 / 60); };

var scheduler = TRexObservable({
    onSubscribe: function () {
        if (!this.subs.length) {
            onNextFrame(this.next);
        }
    },
    next: function () {
        if (this.subs.length) {
            onNextFrame(this.next);
        }
    }
});

function resolveTarget(target) {
    return target instanceof Element ? target : document.querySelector(target);
}

function TyrannoScrollus(options) {
    var self = TRexObservable(newify(this, TyrannoScrollus));
    self.target = resolveTarget(options.targets);
    self._scheduler = options.scheduler || scheduler;
    self.distinct = options.distinct !== false;
    self.tick = (options.direction === 'x' ? updateX : updateY).bind(self);
    return self;
}
function updateX() {
    var self = this;
    var target = self.target;
    self.next(target.scrollLeft / (target.scrollWidth - target.clientWidth));
}
function updateY() {
    var self = this;
    var target = self.target;
    self.next(target.scrollTop / (target.scrollHeight - target.clientHeight));
}
TyrannoScrollus.prototype = {
    get isPlaying() {
        return !!this._sub;
    },
    play: function () {
        var self = this;
        if (!self.isPlaying) {
            self._sub = self._scheduler.subscribe(self.tick);
        }
    },
    pause: function () {
        var self = this;
        if (self.isPlaying) {
            self._sub();
            self._sub = _;
        }
    }
};

function minMax(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

function TweenRex(options) {
    options = options || {};
    var self = TRexObservable(newify(this, TweenRex));
    var frameSize = options.frameSize;
    self._cursor = options.duration || 0;
    self._scheduler = options.scheduler || scheduler;
    self.distinct = options.distinct !== false;
    self.currentTime = 0;
    self.playbackRate = 1;
    self.labels = options.labels || {};
    self._tick = function (delta) {
        var n = self._time + (frameSize || (delta - (self._lastTime || delta)) * self.playbackRate);
        self._lastTime = delta;
        self.seek(n);
    };
    return self;
}
TweenRex.prototype = {
    get duration() {
        var self = this;
        var tweens = self._tweens;
        var maxSize = self._cursor;
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
        this._cursor = value;
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
    add: function (tweens, pos) {
        var self = this;
        if (!self._tweens) {
            self._tweens = [];
        }
        var _tweens = self._tweens;
        if (!isArray(tweens)) {
            tweens = [tweens];
        }
        if (pos === _) {
            pos = self.duration;
        }
        var ilen = tweens.length;
        var tweenObjs = Array(ilen);
        for (var i = 0; i < ilen; i++) {
            var tween = tweens[i];
            if (tween.isPlaying) {
                tween.pause();
            }
            tween._scheduler = _;
            tweenObjs[i] = { pos: pos, tween: tween };
        }
        addAll(_tweens, tweenObjs);
        return function () {
            removeAll(_tweens, tweenObjs);
        };
    },
    play: function () {
        var self = this;
        var scheduler$$1 = self._scheduler;
        if (scheduler$$1 && !self.isPlaying) {
            var isForwards = self.playbackRate >= 0;
            var duration = self.duration;
            var n = self._time;
            if (isForwards && n >= duration) {
                n = 0;
            }
            else if (!isForwards && n <= 0) {
                n = duration;
            }
            self._sub = scheduler$$1.subscribe(self._tick);
            self.seek(n);
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
            self._sub = self._lastTime = _;
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
        if (isForwards && c >= duration) {
            c = duration;
            self.pause();
        }
        else if (!isForwards && c <= 0) {
            c = 0;
            self.pause();
        }
        self._time = c;
        self.next(c / (duration || 1));
        if (tweens) {
            for (var i = 0, ilen = tweens.length; i < ilen; i++) {
                var t = tweens[i];
                var tween = t.tween;
                var startPos = t.pos;
                var endPos = startPos + tween.duration;
                var offset = minMax((c - startPos) / (endPos - startPos), 0, 1);
                tween.next(offset);
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

inherit(window, {
    TyrannoScrollus: TyrannoScrollus,
    TweenRex: TweenRex
});

}());
