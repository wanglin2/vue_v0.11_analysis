/**
 * Check is a string starts with $ or _
 *  检查一个字符串是不是以$或_开头
 * @param {String} str
 * @return {Boolean}
 */

exports.isReserved = function (str) {
  var c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}

/**
 * Guard text output, make sure undefined outputs
 * empty string
 *
 * @param {*} value
 * @return {String}
 */

exports.toString = function (value) {
  return value == null
    ? ''
    : value.toString()
}

/**
 * Check and convert possible numeric numbers before
 * setting back to data
 *
 * @param {*} value
 * @return {*|Number}
 */

exports.toNumber = function (value) {
  return (
    isNaN(value) ||
    value === null ||
    typeof value === 'boolean'
  ) ? value
    : Number(value)
}

/**
 * Strip quotes from a string
 * 从字符串中去掉引号
 *
 * @param {String} str
 * @return {String | false}
 */

exports.stripQuotes = function (str) {
  var a = str.charCodeAt(0)
  var b = str.charCodeAt(str.length - 1)
  return a === b && (a === 0x22 || a === 0x27)
    ? str.slice(1, -1)
    : false
}

/**
 * Replace helper
 *
 * @param {String} _ - matched delimiter
 * @param {String} c - matched char
 * @return {String}
 */
function toUpper (_, c) {
  return c ? c.toUpperCase () : ''
}

/**
 * Camelize a hyphen-delmited string.
 *
 * @param {String} str
 * @return {String}
 */

var camelRE = /-(\w)/g
exports.camelize = function (str) {
  return str.replace(camelRE, toUpper)
}

/**
 * Converts hyphen/underscore/slash delimitered names into
 * camelized classNames.
 * 将连字符/下划线/斜杠分隔的名称转换为camellized类名。
 *
 * e.g. my-component => MyComponent
 *      some_else    => SomeElse
 *      some/comp    => SomeComp
 *
 * @param {String} str
 * @return {String}
 */

var classifyRE = /(?:^|[-_\/])(\w)/g
exports.classify = function (str) {
  return str.replace(classifyRE, toUpper)
}

/**
 * Simple bind, faster than native
 * 简单的bind，比原生方法更快
 *
 * @param {Function} fn
 * @param {Object} ctx
 * @return {Function}
 */

exports.bind = function (fn, ctx) {
  return function () {
    return fn.apply(ctx, arguments)
  }
}

/**
 * Convert an Array-like object to a real Array.
 * 将类似数组的对象转换为实数组。
 *
 * @param {Array-like} list
 * @param {Number} [start] - start index
 * @return {Array}
 */

exports.toArray = function (list, start) {
  start = start || 0
  var i = list.length - start
  var ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Mix properties into target object.
 * 将属性混合到目标对象中。
 *
 * @param {Object} to
 * @param {Object} from
 */

exports.extend = function (to, from) {
  for (var key in from) {
    to[key] = from[key]
  }
  return to
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 快速对象检查-当我们知道原语值是符合JSON的类型时，它主要用于从原语值中区分对象。
 *
 * @param {*} obj
 * @return {Boolean}
 */

exports.isObject = function (obj) {
  return obj && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * 严格的对象类型检查
 * for plain JavaScript objects.
 * 仅对普通JavaScript对象返回true
 *
 * @param {*} obj
 * @return {Boolean}
 */

var toString = Object.prototype.toString
exports.isPlainObject = function (obj) {
  return toString.call(obj) === '[object Object]'
}

/**
 * Array type check.
 * 数组类型检查。
 *
 * @param {*} obj
 * @return {Boolean}
 */

exports.isArray = function (obj) {
  return Array.isArray(obj)
}

/**
 * Define a non-enumerable property
 * 定义不可枚举属性
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 * @param {Boolean} [enumerable]
 */

exports.define = function (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value        : val,
    enumerable   : !!enumerable,
    writable     : true,
    configurable : true
  })
}

/**
 * Debounce a function so it only gets called after the
 * input stops arriving after the given wait period.
 *
 * @param {Function} func
 * @param {Number} wait
 * @return {Function} - the debounced function
 */

exports.debounce = function(func, wait) {
  var timeout, args, context, timestamp, result
  var later = function() {
    var last = Date.now() - timestamp
    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      result = func.apply(context, args)
      if (!timeout) context = args = null
    }
  }
  return function() {
    context = this
    args = arguments
    timestamp = Date.now()
    if (!timeout) {
      timeout = setTimeout(later, wait)
    }
    return result
  }
}