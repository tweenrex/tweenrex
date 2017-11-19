(function () {
'use strict';

var math = Math;
var min = math.min;
var max = math.max;
var round = math.round;
var sqrt = math.sqrt;
var floor = math.floor;
function clamp(val, lower, upper) {
    return max(lower, min(upper, val));
}

var isArray = Array.isArray;
function pushAll(a, b) {
    a.push.apply(a, b);
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

var optionNames = ['targets', 'secondary', 'easing'];
function renderer(ro) {
    return function (opts) {
        var targets = ro.getTargets(opts.targets);
        var renderers = [];
        var _loop_1 = function (t, tlen) {
            var target = targets[t];
            var _loop_2 = function (prop) {
                if (optionNames.indexOf(prop) === -1) {
                    var targetAdapter_1 = ro.getAdapter(target, prop);
                    var value = opts[prop];
                    var valueConfig_1 = isDefined(value.value)
                        ? value
                        : { value: value };
                    if (!isArray(valueConfig_1.value)) {
                        valueConfig_1.value = [targetAdapter_1.get(target, prop), valueConfig_1.value];
                    }
                    var ilen = valueConfig_1.value.length;
                    var values_1 = Array(ilen);
                    for (var i = 0; i < ilen; i++) {
                        var r = valueConfig_1.value[i];
                        var parsed = ro.parse(r, valueConfig_1.type);
                        values_1[i] = parsed.value;
                        if (!valueConfig_1.mix) {
                            valueConfig_1.mix = parsed.mix;
                        }
                        if (!valueConfig_1.format) {
                            valueConfig_1.format = parsed.format;
                        }
                    }
                    var renderFn_1 = function (offset) {
                        var total = values_1.length - 1;
                        var totalOffset = total * offset;
                        var stepStart = max(floor(totalOffset), 0);
                        var stepEnd = min(stepStart + 1, total);
                        if (total === stepStart) {
                            stepStart--;
                        }
                        if (!stepEnd) {
                            stepEnd++;
                        }
                        var nextValue = valueConfig_1.mix(values_1[stepStart], values_1[stepEnd], totalOffset - stepStart);
                        if (valueConfig_1.format) {
                            nextValue = valueConfig_1.format(nextValue);
                        }
                        targetAdapter_1.set(target, prop, nextValue);
                    };
                    renderers.push(function (offset) {
                        if (valueConfig_1.easing) {
                            offset = valueConfig_1.easing(offset);
                        }
                        if (valueConfig_1.secondary) {
                            valueConfig_1.secondary(offset, renderFn_1);
                        }
                        else {
                            renderFn_1(offset);
                        }
                    });
                }
            };
            for (var prop in opts) {
                _loop_2(prop);
            }
        };
        for (var t = 0, tlen = targets.length; t < tlen; t++) {
            _loop_1(t, tlen);
        }
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

function resolveDomTargets(targets, results) {
    if (isArray(targets)) {
        for (var i = 0, ilen = targets.length; i < ilen; i++) {
            resolveDomTargets(targets[i], results);
        }
    }
    else if (isString(targets)) {
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
    var ilen = min(aTerms.length, bTerms.length);
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
    parse: function (value, type) {
        if (!type) {
            if (isNumeric(value)) {
                type = NUMBER;
            }
            else if (isString(value) && /\d*/.test(value)) {
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
    },
    getAdapter: function (target, prop) {
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
    },
    getTargets: function (targets) {
        var results = [];
        resolveDomTargets(targets, results);
        return results;
    }
});

var global = window;
var tweenrex = global.tweenrex || (global.tweenrex = {});
tweenrex.interpolate = interpolate;

}());
