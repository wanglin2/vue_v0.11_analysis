var _ = require('../util')
var config = require('../config')
var Dep = require('./dep')
var arrayMethods = require('./array')
var arrayKeys = Object.getOwnPropertyNames(arrayMethods)
require('./object')

var uid = 0

/**
 * Type enums
 * 类型定义
 */

var ARRAY  = 0
var OBJECT = 1

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 * 通过使用__proto__截取原型链来扩充目标对象或数组__
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

function protoAugment (target, src) {
  target.__proto__ = src
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 * 通过定义隐藏属性来扩充目标对象或数组。
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

function copyAugment (target, src, keys) {
  var i = keys.length
  var key
  while (i--) {
    key = keys[i]
    _.define(target, key, src[key])
  }
}

/**
 * Observer class that are attached to each observed
 * 附加到每个观察对象的观察者类。
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 * 连接后，观察者将目标对象的属性键转换为getter/setter，用于收集依赖项并发送更新。
 *
 * @param {Array|Object} value
 * @param {Number} type
 * @constructor
 */

function Observer (value, type) {
  this.id = ++uid
  this.value = value
  this.deps = []
  _.define(value, '__ob__', this)
  if (type === ARRAY) {
    var augment = config.proto && _.hasProto
      ? protoAugment
      : copyAugment
    augment(value, arrayMethods, arrayKeys)
    this.observeArray(value)
  } else if (type === OBJECT) {
    this.walk(value)
  }
}

Observer.target = null

var p = Observer.prototype

/**
 * Attempt to create an observer instance for a value,
 * 尝试为值创建观察者实例
 * returns the new observer if successfully observed,
 * 如果观察成功，则返回新的观察者
 * or the existing observer if the value already has one.
 * 或者现有的观察器（如果值已经有一个观察器）
 *
 * @param {*} value
 * @return {Observer|undefined}
 * @static
 */

Observer.create = function (value) {
  if (
    value &&
    value.hasOwnProperty('__ob__') &&
    value.__ob__ instanceof Observer
  ) {
    return value.__ob__
  } else if (_.isArray(value)) {
    return new Observer(value, ARRAY)
  } else if (
    _.isPlainObject(value) &&
    !value._isVue // avoid Vue instance避免观察vue实例
  ) {
    return new Observer(value, OBJECT)
  }
}

/**
 * Walk through each property and convert them into
 * 遍历每个属性并将它们转换为getter/setter
 * getter/setters. This method should only be called when
 * 仅当值类型为Object时才应调用此方法
 * value type is Object. Properties prefixed with `$` or `_`
 * and accessor properties are ignored.
 * 以`$`或``为前缀的属性和访问器属性将被忽略。
 *
 * @param {Object} obj
 */

p.walk = function (obj) {
  var keys = Object.keys(obj)
  var i = keys.length
  var key, prefix
  while (i--) {
    key = keys[i]
    prefix = key.charCodeAt(0)
    if (prefix !== 0x24 && prefix !== 0x5F) { // skip $ or _
      this.convert(key, obj[key])
    }
  }
}

/**
 * Try to carete an observer for a child value,
 * 试着给子值创建一个观察者
 * and if value is array, link dep to the array.
 * 如果value是array，则将dep链接到数组
 *
 * @param {*} val
 * @return {Dep|undefined}
 */

p.observe = function (val) {
  return Observer.create(val)
}

/**
 * Observe a list of Array items.
 * 观察数组项列表
 *
 * @param {Array} items
 */

p.observeArray = function (items) {
  var i = items.length
  while (i--) {
    this.observe(items[i])
  }
}

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 * 将属性转换为getter/setter，以便在访问/更改属性时发出事件。
 *
 * @param {String} key
 * @param {*} val
 */

p.convert = function (key, val) {
  var ob = this
  var childOb = ob.observe(val)
  var dep = new Dep()
  if (childOb) {
    childOb.deps.push(dep)
  }
  Object.defineProperty(ob.value, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      // Observer.target is a watcher whose getter is
      // currently being evaluated.
      // 观察者目标是当前正在评估其getter的观察者。
      if (Observer.target) {
        Observer.target.addDep(dep)
      }
      return val
    },
    set: function (newVal) {
      if (newVal === val) return
      // remove dep from old value
      // 从旧的值里移除dep
      var oldChildOb = val && val.__ob__
      if (oldChildOb) {
        var oldDeps = oldChildOb.deps
        oldDeps.splice(oldDeps.indexOf(dep), 1)
      }
      val = newVal
      // add dep to new value
      // 给新的值添加dep
      var newChildOb = ob.observe(newVal)
      if (newChildOb) {
        newChildOb.deps.push(dep)
      }
      dep.notify()
    }
  })
}

/**
 * Notify change on all self deps on an observer.
 * 通知一个观察者自己的所有的依赖进行更新。
 * This is called when a mutable value mutates. e.g.
 * 当可变值发生变化时调用此函数。例如
 * when an Array's mutating methods are called, or an
 * Object's $add/$delete are called.
 * 当一个数组的变异方法被调用，或者一个对象的$add/$delete被调用时。
 */

p.notify = function () {
  var deps = this.deps
  for (var i = 0, l = deps.length; i < l; i++) {
    deps[i].notify()
  }
}

/**
 * Add an owner vm, so that when $add/$delete mutations
 * happen we can notify owner vms to proxy the keys and
 * 添加一个所有者vm，这样当发生$Add/$delete突变时，我们就可以通知所有者vm代理key并消化观察者
 * digest the watchers. This is only called when the object
 * is observed as an instance's root $data.
 * 仅当对象被观察为实例的根$data时，才会调用此函数
 *
 * @param {Vue} vm
 */

p.addVm = function (vm) {
  (this.vms = this.vms || []).push(vm)
}

/**
 * Remove an owner vm. This is called when the object is
 * 移除所有者实例
 * swapped out as an instance's $data object.
 * 当对象作为实例的$data对象交换出去时，会调用此函数
 *
 * @param {Vue} vm
 */

p.removeVm = function (vm) {
  this.vms.splice(this.vms.indexOf(vm), 1)
}

module.exports = Observer
