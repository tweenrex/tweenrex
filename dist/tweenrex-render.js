(function () {
'use strict';

var math = Math;
var min = math.min;


var max = math.max;
var round = math.round;
var sqrt = math.sqrt;
var floor = math.floor;
var degrees = 180 / math.PI;
function clamp(val, bottom, top) {
    return val < bottom ? bottom : val > top ? top : val;
}

var cssVarExp = /^\-\-[a-z0-9\-]+$/i;



var _ = undefined;
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
        var stepStart = max(floor(totalOffset), 0);
        var stepEnd = min(stepStart + 1, total);
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

var global = window;
var tweenrex = global.tweenrex || (global.tweenrex = {});
tweenrex.interpolate = interpolate;

}());
