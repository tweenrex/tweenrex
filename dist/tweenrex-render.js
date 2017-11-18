(function () {
'use strict';

var math = Math;
var min = math.min;
var max = math.max;
var round = math.round;
var sqrt = math.sqrt;
function minMax(val, lower, upper) {
    return max(lower, min(upper, val));
}

var cssVarExp = /^\-\-[a-z0-9\-]+$/i;



var _ = undefined;
var sq255 = 65025;

function isDOM(target) {
    return target instanceof Element;
}
function isNumber(obj) {
    return typeof obj === 'number';
}
function isString(obj) {
    return typeof obj === 'string';
}
function isNumeric(obj) {
    return isNumber(obj) || /^\-?\d*\.?\d+$/.test(obj);
}
function isDefined(obj) {
    return obj !== _;
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
        else if (isString(value) && /\d*/.test(value)) {
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
                value = round(sqrt(minMax(mixNumber(a * a, b * b, o), 0, sq255)));
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

var global = window;
var tweenrex = global.tweenrex || (global.tweenrex = {});
tweenrex.interpolate = interpolate;

}());
