(function () {
'use strict';

const math = Math;
const abs = math.abs;
const cos = math.cos;
const sin = math.sin;
const sqrt = math.sqrt;
const pow = math.pow;
const ceil = math.ceil;
const floor = math.floor;

function recurve(easing) {
    return {
        in: easing,
        out: (n) => 1 - easing(1 - n),
        inOut: (n) => n < 0.5 ? easing(n * 2.0) / 2.0 : 1 - easing((1 - n) * 2) / 2
    };
}

function power(c) {
    return recurve(n => pow(n, c));
}

function linear(t) {
    return t;
}

const quad = power(2);

const cubic = power(3);

const quart = power(4);

const quint = power(5);

const back = ((f) => {
    return recurve(n => n * n * ((f + 1) * n - f));
});
const defaultEasing = back(1.70158);
back.in = defaultEasing.in;
back.out = defaultEasing.out;
back.inOut = defaultEasing.inOut;

function mirror(ease) {
    return (n) => 1 - ease(1 - n);
}

const bounce = ((n1) => {
    return recurve(mirror(n => {
        if (n < 0.36363636) {
            return n1 * n * n;
        }
        if (n < 0.72727273) {
            return n1 * (n -= 0.545455) * n + 0.75;
        }
        if (n < 0.90909091) {
            return n1 * (n -= 0.818182) * n + 0.9375;
        }
        return n1 * (n -= 0.954545) * n + 0.984375;
    }));
});
const defaultEasing$1 = bounce(7.5625);
bounce.in = defaultEasing$1.in;
bounce.out = defaultEasing$1.out;
bounce.inOut = defaultEasing$1.inOut;

const circ = recurve(n => -1 * (sqrt(1 - pow(n, 2)) - 1));

const pi = math.PI;
const tau = 2 * pi;

const elastic = ((amplitude, period, bounces) => {
    const s = period / bounces;
    return recurve(n => {
        if (n === 0 || n === 1) {
            return n;
        }
        return -amplitude * pow(2, 10 * (n - 1)) * sin((n - 1 - s) * tau / period);
    });
});
const defaultEasing$2 = elastic(1, 0.4, 4);
elastic.in = defaultEasing$2.in;
elastic.out = defaultEasing$2.out;
elastic.inOut = defaultEasing$2.inOut;

const expo = ((f) => {
    return recurve(n => n === 0 ? 0 : pow(f, 10 * (n - 1)));
});
const defaultEasing$3 = expo(2);
expo.in = defaultEasing$3.in;
expo.out = defaultEasing$3.out;
expo.inOut = defaultEasing$3.inOut;

const sine = recurve(n => -cos(n * pi / 2) + 1);

const MAX_ITERATIONS = 19;
const oneDimensionalCubicBezier = (c1, c2, t) => {
    const it = 1 - t;
    return ((it * c1 + t * c2) * 3 * it + t * t) * t;
};
const cubicBezier = (cx1, cy1, cx2, cy2, maxIterations) => {
    if (cx1 < 0 || cx1 > 1 || cx2 < 0 || cx2 > 1) {
        return linear;
    }
    return (t) => {
        if (t <= 0 || t >= 1) {
            return t;
        }
        let min = 0;
        let max = 1;
        let iterations = maxIterations || MAX_ITERATIONS;
        let mid;
        let tPos;
        do {
            mid = 0.5 * (min + max);
            tPos = oneDimensionalCubicBezier(cx1, cx2, mid);
            if (abs(t - tPos) < 0.0001) {
                return oneDimensionalCubicBezier(cy1, cy2, mid);
            }
            if (tPos < t) {
                min = mid;
            }
            else {
                max = mid;
            }
        } while (--iterations);
        mid = 0.5 * (min + max);
        return oneDimensionalCubicBezier(cy1, cy2, mid);
    };
};

function steps(count, mode) {
    const fn = mode === 'end' ? floor : ceil;
    return (x) => {
        const n = fn(x * count) / count;
        return n < 0 ? 0 : n > 1 ? 1 : n;
    };
}

function blend(funcs, weights = []) {
    const l = funcs.length;
    let total = 0;
    for (let i = 0; i < l; i++) {
        total += i < weights.length ? weights[i] : 1;
    }
    const offsets = Array(l);
    let sum = 0;
    for (let i = 0; i < l; i++) {
        sum += weights[i];
        offsets[i] = sum / total;
    }
    return (n) => {
        for (let i = 0; i < l; i++) {
            if (n <= offsets[i]) {
                const prevOffset = i > 0 ? offsets[i - 1] : 0;
                return funcs[i]((n - prevOffset) / (offsets[i] - prevOffset));
            }
        }
        return 1.0;
    };
}

function chain(funcs, offsets = []) {
    const l = funcs.length;
    for (let i = offsets.length; i < l; i++) {
        const prevOffset = i > 0 ? offsets[i - 1] : 0.0;
        offsets.push(0.5 * (prevOffset + 1.0));
    }
    return (n) => {
        for (let i = 0; i < l - 1; i++) {
            const next = offsets[i + 1];
            if (n <= next) {
                const p2 = offsets[i];
                return funcs[i]((n - p2) / (next - p2));
            }
        }
        const p = l > 1 ? offsets[l - 1] : 0.0;
        return funcs[l - 1]((n - p) / (1 - p));
    };
}

function repeat(n) {
    return n - ~~n;
}

function pingpong(n) {
    const floor = ~~n;
    return floor % 2 ? 1.0 - n + floor : n - floor;
}

function divide(options) {
    const cycle = options.pingpong ? pingpong : repeat;
    const ease = options.easing || linear;
    return (n) => ease(cycle(n * options.times));
}



var easing = Object.freeze({
	power: power,
	linear: linear,
	quad: quad,
	cubic: cubic,
	quart: quart,
	quint: quint,
	back: back,
	bounce: bounce,
	circ: circ,
	elastic: elastic,
	expo: expo,
	sine: sine,
	cubicBezier: cubicBezier,
	steps: steps,
	blend: blend,
	recurve: recurve,
	chain: chain,
	divide: divide,
	mirror: mirror,
	pingpong: pingpong,
	repeat: repeat
});

var w = window;
var t = w.tweenrex || (w.tweenrex = {});
t.easing = easing;

}());
