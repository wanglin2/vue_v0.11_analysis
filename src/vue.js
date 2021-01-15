var _ = require('./util')
var extend = _.extend

/**
 * The exposed Vue constructor.
 * 导出Vue构造函数。
 *
 * API conventions:
 * - public API methods/properties are prefiexed with `$`
 * - internal methods/properties are prefixed with `_`
 * - non-prefixed properties are assumed to be proxied user
 *   data.
 *
 * @constructor
 * @param {Object} [options]
 * @public
 */

function Vue (options) {
  this._init(options)
}

/**
 * Mixin global API
 * 混合全局api
 */
extend(Vue, require('./api/global'))

/**
 * Vue and every constructor that extends Vue has an
 * associated options object, which can be accessed during
 * compilation steps as `this.constructor.options`.
 * Vue和每个扩展Vue的构造函数都有一个关联的options对象，在编译步骤中可以作为`this.constructor.options选项`.
 *
 * These can be seen as the default options of every
 * Vue instance.
 * 这些可以看作是每个Vue实例的默认选项。
 */

Vue.options = {
  directives  : require('./directives'),
  filters     : require('./filters'),
  partials    : {},
  transitions : {},
  components  : {}
}

/**
 * Build up the prototype
 * 建立原型
 */

var p = Vue.prototype

/**
 * $data has a setter which does a bunch of
 * teardown/setup work
 * $data有一个setter，它执行大量的拆卸/设置工作
 */

Object.defineProperty(p, '$data', {
  get: function () {
    return this._data
  },
  set: function (newData) {
    this._setData(newData)
  }
})

/**
 * Mixin internal instance methods
 * Mixin内部实例方法
 */

extend(p, require('./instance/init'))
extend(p, require('./instance/events'))
extend(p, require('./instance/scope'))
extend(p, require('./instance/compile'))

/**
 * Mixin public API methods
 * Mixin公共API方法
 */

extend(p, require('./api/data'))
extend(p, require('./api/dom'))
extend(p, require('./api/events'))
extend(p, require('./api/child'))
extend(p, require('./api/lifecycle'))

module.exports = _.Vue = Vue