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
        this.next = function (n) {
            var self = _this;
            var subs2 = self.subs.slice();
            for (var i = 0; i < subs2.length; i++) {
                subs2[i](n);
            }
            if (self.afterNext) {
                self.afterNext();
            }
        };
        this.subscribe = function (fn) {
            var self = _this;
            var subs = self.subs;
            if (self.beforeNext) {
                self.beforeNext();
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

var raf = window.requestAnimationFrame;
var scheduler = new Observable();
scheduler.beforeNext = function () {
    if (!this.subs.length) {
        raf(this.next);
    }
};
scheduler.afterNext = function () {
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
            var n = self.currentTime + (self._frameSize || (delta - (self._lastTime || delta)) * self.playbackRate);
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
            var n = self.currentTime;
            if (isForwards && n >= duration) {
                n = 0;
            }
            else if (!isForwards && n <= 0) {
                n = duration;
            }
            self._sub = self._scheduler.subscribe(self.tick);
            self.seek(n);
        }
    };
    Tween.prototype.pause = function () {
        var sub = this._sub;
        if (sub) {
            sub();
            this._sub = _;
        }
    };
    Tween.prototype.reverse = function () {
        this.playbackRate *= -1;
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
        self.currentTime = n;
        self.next(n / (duration || 1));
    };
    return Tween;
}(Observable));

exports.Tween = Tween;

return exports;

}({}));
