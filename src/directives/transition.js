module.exports = {

  priority: 1000,
  isLiteral: true,

  bind: function () {
    if (!this._isDynamicLiteral) {
      this.update(this.expression)
    }
  },

  update: function (id) {
    var vm = this.el.__vue__ || this.vm
    this.el.__v_trans = {
      id: id,
      // resolve the custom transition functions now
      // so the transition module knows this is a
      // javascript transition without having to check
      // computed CSS.
      // 现在解析自定义转换函数，以便转换模块知道这是一个javascript转换，而不必检查计算的CSS。
      fns: vm.$options.transitions[id]
    }
  }

}