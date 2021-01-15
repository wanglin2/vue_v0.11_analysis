var _ = require('../util')
var templateParser = require('../parsers/template')

module.exports = {

  isLiteral: true,

  /**
   * Setup. Two possible usages:
   * 初始化。两种可能的用法
   *
   * - static:
   *   v-component="comp"
   *
   * - dynamic:
   *   v-component="{{currentView}}"
   */

  bind: function () {
    if (!this.el.__vue__) {
      // create a ref anchor
      // 创建参考锚定
      // 创建一个注释元素替换掉该自定义元素
      this.ref = document.createComment('v-component')
      _.replace(this.el, this.ref)
      // check keep-alive options.
      // 检查keep-alive选项
      // If yes, instead of destroying the active vm when
      // hiding (v-if) or switching (dynamic literal) it,
      // 如果是，则在隐藏（v-If）或切换（动态文字）活动vm时不销毁它，
      // we simply remove it from the DOM and save it in a
      // cache object, with its constructor id as the key.
      // 我们只需将其从DOM中移除，并将其保存在缓存对象中，其构造函数id作为键。
      this.keepAlive = this._checkParam('keep-alive') != null
      // check ref
      // 检查引用
      debugger
      this.refID = _.attr(this.el, 'ref')
      if (this.keepAlive) {
        this.cache = {}
      }
      // check inline-template
      // 检查是否是内联模板
      if (this._checkParam('inline-template') !== null) {
        // extract inline template as a DocumentFragment
        // 将内联模板提取为文档片段
        this.template = _.extractContent(this.el, true)
      }
      // if static, build right now.
      // 如果是静态的，立即生成
      if (!this._isDynamicLiteral) {
        this.resolveCtor(this.expression)
        var child = this.build()
        child.$before(this.ref)
        this.setCurrent(child)
      } else {
        // check dynamic component params
        // 检查动态组件参数
        this.readyEvent = this._checkParam('wait-for')
        this.transMode = this._checkParam('transition-mode')
      }
    } else {
      _.warn(
        'v-component="' + this.expression + '" cannot be ' +
        'used on an already mounted instance.'
      )
    }
  },

  /**
   * Resolve the component constructor to use when creating
   * the child vm.
   * 解析创建子vm时要使用的组件构造函数。
   */

  resolveCtor: function (id) {
    this.ctorId = id
    this.Ctor = this.vm.$options.components[id]
    _.assertAsset(this.Ctor, 'component', id)
  },

  /**
   * Instantiate/insert a new child vm.
   * 实例化/插入新的子vm。
   * If keep alive and has cached instance, insert that
   * 如果keep alive并且有缓存实例，则插入该实例；
   * instance; otherwise build a new one and cache it.
   * 否则，构建一个新的并缓存它。
   *
   * @return {Vue} - the created instance
   */

  build: function () {
    if (this.keepAlive) {
      var cached = this.cache[this.ctorId]
      if (cached) {
        return cached
      }
    }
    var vm = this.vm
    var el = templateParser.clone(this.el)
    if (this.Ctor) {
      var child = vm.$addChild({
        el: el,
        template: this.template,
        _asComponent: true,
        _host: this._host
      }, this.Ctor)
      if (this.keepAlive) {
        this.cache[this.ctorId] = child
      }
      return child
    }
  },

  /**
   * Teardown the current child, but defers cleanup so
   * that we can separate the destroy and removal steps.
   */

  unbuild: function () {
    var child = this.childVM
    if (!child || this.keepAlive) {
      return
    }
    // the sole purpose of `deferCleanup` is so that we can
    // "deactivate" the vm right now and perform DOM removal
    // later.
    child.$destroy(false, true)
  },

  /**
   * Remove current destroyed child and manually do
   * the cleanup after removal.
   *
   * @param {Function} cb
   */

  remove: function (child, cb) {
    var keepAlive = this.keepAlive
    if (child) {
      child.$remove(function () {
        if (!keepAlive) child._cleanup()
        if (cb) cb()
      })
    } else if (cb) {
      cb()
    }
  },

  /**
   * Update callback for the dynamic literal scenario,
   * e.g. v-component="{{view}}"
   */

  update: function (value) {
    if (!value) {
      // just destroy and remove current
      this.unbuild()
      this.remove(this.childVM)
      this.unsetCurrent()
    } else {
      this.resolveCtor(value)
      this.unbuild()
      var newComponent = this.build()
      var self = this
      if (this.readyEvent) {
        newComponent.$once(this.readyEvent, function () {
          self.swapTo(newComponent)
        })
      } else {
        this.swapTo(newComponent)
      }
    }
  },

  /**
   * Actually swap the components, depending on the
   * 实际交换组件，具体取决于转换模式。
   * transition mode. Defaults to simultaneous.
   * 默认为同时
   *
   * @param {Vue} target
   */

  swapTo: function (target) {
    var self = this
    var current = this.childVM
    this.unsetCurrent()
    this.setCurrent(target)
    switch (self.transMode) {
      case 'in-out':
        target.$before(self.ref, function () {
          self.remove(current)
        })
        break
      case 'out-in':
        self.remove(current, function () {
          target.$before(self.ref)
        })
        break
      default:
        self.remove(current)
        target.$before(self.ref)
    }
  },

  /**
   * Set childVM and parent ref
   * 设置childVM和parent ref
   */
  
  setCurrent: function (child) {
    debugger
    this.childVM = child
    var refID = child._refID || this.refID
    if (refID) {
      this.vm.$[refID] = child
    }
  },

  /**
   * Unset childVM and parent ref
   * 取消设置childVM和父ref
   */

  unsetCurrent: function () {
    var child = this.childVM
    this.childVM = null
    var refID = (child && child._refID) || this.refID
    if (refID) {
      this.vm.$[refID] = null
    }
  },

  /**
   * Unbind.
   */

  unbind: function () {
    this.unbuild()
    // destroy all keep-alive cached instances
    if (this.cache) {
      for (var key in this.cache) {
        this.cache[key].$destroy()
      }
      this.cache = null
    }
  }

}