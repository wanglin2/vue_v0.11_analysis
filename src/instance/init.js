var mergeOptions = require('../util/merge-option')

/**
 * The main init sequence. This is called for every
 * instance, including ones that are created from extended
 * constructors.
 * 每个实例都会调用它，包括从扩展构造函数创建的实例。
 *
 * @param {Object} options - this options object should be
 *                           the result of merging class
 *                           options and the options passed
 *                           in to the constructor.
 * 这个options对象应该是合并类选项和传递给构造函数的选项的结果。
 */

exports._init = function (options) {

  options = options || {}

  this.$el           = null
  this.$parent       = options._parent
  this.$root         = options._root || this
  this.$             = {} // child vm references子实例引用
  this.$$            = {} // element references元素引用
  this._watcherList  = [] // all watchers as an array所有的watchers
  this._watchers     = {} // internal watchers as a hash内部的watchers
  this._userWatchers = {} // user watchers as a hash用户的watchers
  this._directives   = [] // all directives所有的指令

  // a flag to avoid this being observed
  // 避免被观察的标志
  this._isVue = true

  // events bookkeeping
  // 事件
  this._events         = {}    // registered callbacks注册的回调
  this._eventsCount    = {}    // for $broadcast optimization用于$broadcast优化
  this._eventCancelled = false // for event cancellation用于取消事件

  // block instance properties
  // 块实例属性
  this._isBlock     = false
  this._blockStart  =          // @type {CommentNode}
  this._blockEnd    = null     // @type {CommentNode}

  // lifecycle state
  // 生命周期状态
  this._isCompiled  =
  this._isDestroyed =
  this._isReady     =
  this._isAttached  =
  this._isBeingDestroyed = false

  // children
  this._children = []
  this._childCtors = {}

  // transclusion unlink functions
  this._containerUnlinkFn =
  this._contentUnlinkFn = null

  // transcluded components that belong to the parent.
  // need to keep track of them so that we can call
  // attached/detached hooks on them.
  this._transCpnts = []
  this._host = options._host

  // push self into parent / transclusion host
  if (this.$parent) {
    this.$parent._children.push(this)
  }
  if (this._host) {
    this._host._transCpnts.push(this)
  }

  // props used in v-repeat diffing
  // v-repeat操作会用到
  this._new = true
  this._reused = false

  // merge options.
  // 合并参数
  options = this.$options = mergeOptions(
    this.constructor.options,
    options,
    this
  )

  // set data after merge.
  // 合并后在设置_data数据
  this._data = options.data || {}

  // initialize data observation and scope inheritance.
  // 初始化数据观察和范围继承。
  this._initScope()

  // setup event system and option events.
  // 初始化事件和生命周期
  this._initEvents()

  // call created hook
  // 调用created生命周期
  this._callHook('created')

  // if `el` option is passed, start compilation.
  // 如果传了挂载元素，开始编译
  if (options.el) {
    this.$mount(options.el)
  }
}