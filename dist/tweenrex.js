var tweenrex = (function (exports) {
'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var Observable = (function () {
    function Observable() {
        var _this = this;
        this.subs = [];
        this._buffer = [];
        this.next = function (n) {
            var self = _this;
            var buffer = self._buffer;
            buffer.push(n);
            if (buffer.length > 1) {
                return;
            }
            for (var h = 0; h < buffer.length; h++) {
                var subs2 = self.subs.slice();
                var c = buffer[h];
                for (var i = 0; i < subs2.length; i++) {
                    subs2[i](c);
                }
            }
            buffer.length = 0;
            if (self.onNext) {
                self.onNext();
            }
        };
        this.subscribe = function (fn) {
            var self = _this;
            var subs = self.subs;
            if (self.onSubscribe) {
                self.onSubscribe();
            }
            subs.push(fn);
            return function () {
                var index = subs.indexOf(fn);
                if (index !== -1) {
                    subs.splice(index, 1);
                }
            };
        };
    }
    return Observable;
}());

var _ = undefined;

var raf = typeof window !== 'undefined'
    ? window.requestAnimationFrame
    : function (fn) { return setTimeout(function () { return fn(performance.now()); }, 1000 / 60); };
var scheduler = new Observable();
scheduler.onSubscribe = function () {
    if (!this.subs.length) {
        raf(this.next);
    }
};
scheduler.onNext = function () {
    if (this.subs.length) {
        raf(this.next);
    }
};

var Tween = (function (_super) {
    __extends(Tween, _super);
    function Tween(options) {
        var _this = _super.call(this) || this;
        _this.tick = function (delta) {
            var self = _this;
            var n = self._time + (self._frameSize || (delta - (self._lastTime || delta)) * self.playbackRate);
            self._lastTime = delta;
            self.seek(n);
        };
        options = options || {};
        var self = _this instanceof Tween ? _this : Object.create(Tween.prototype);
        self._scheduler = options.scheduler || scheduler;
        self._frameSize = options.frameSize;
        self.duration = options.duration;
        self.currentTime = 0;
        self.playbackRate = 1;
        return self;
    }
    Object.defineProperty(Tween.prototype, "currentTime", {
        get: function () {
            return this._time;
        },
        set: function (time) {
            this.seek(time);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Tween.prototype, "isPlaying", {
        get: function () {
            return !!this._sub;
        },
        enumerable: true,
        configurable: true
    });
    Tween.prototype.play = function () {
        var self = this;
        if (!self.isPlaying) {
            var isForwards = self.playbackRate >= 0;
            var duration = self.duration;
            var n = self._time;
            if (isForwards && n >= duration) {
                n = 0;
            }
            else if (!isForwards && n <= 0) {
                n = duration;
            }
            self._sub = self._scheduler.subscribe(self.tick);
            self.seek(n);
        }
        return self;
    };
    Tween.prototype.restart = function () {
        var self = this;
        return self
            .pause()
            .seek(self.playbackRate >= 0 ? 0 : self.duration)
            .play();
    };
    Tween.prototype.pause = function () {
        var self = this;
        var sub = self._sub;
        if (sub) {
            sub();
            self._sub = self._lastTime = _;
        }
        return self;
    };
    Tween.prototype.reverse = function () {
        this.playbackRate *= -1;
        return this;
    };
    Tween.prototype.seek = function (n) {
        var self = this;
        var isForwards = self.playbackRate >= 0;
        var duration = self.duration;
        if (isForwards && n >= duration) {
            n = duration;
            self.pause();
        }
        else if (!isForwards && n <= 0) {
            n = 0;
            self.pause();
        }
        self._time = n;
        self.next(n / (duration || 1));
        return self;
    };
    return Tween;
}(Observable));

exports.Tween = Tween;

return exports;

}({}));
