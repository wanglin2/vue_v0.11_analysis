module.exports = {

  /**
   * The prefix to look for when parsing directives.
   * 解析指令时要查找的前缀。
   *
   * @type {String}
   */

  prefix: 'v-',

  /**
   * Whether to print debug messages.
   * 是否打印调试消息。
   * Also enables stack trace for warnings.
   * 还启用警告的堆栈跟踪。
   *
   * @type {Boolean}
   */

  debug: false,

  /**
   * Whether to suppress warnings.
   * 是否抑制警告。
   *
   * @type {Boolean}
   */

  silent: false,

  /**
   * Whether allow observer to alter data objects'
   * __proto__.
   * 是否允许observer更改Whether数据对象的__proto__。
   *
   * @type {Boolean}
   */

  proto: true,

  /**
   * Whether to parse mustache tags in templates.
   * 是否解析模板中的mustache标记。
   *
   * @type {Boolean}
   */

  interpolate: true,

  /**
   * Whether to use async rendering.
   * 是否使用异步渲染
   */

  async: true,

  /**
   * Whether to warn against errors caught when evaluating
   * expressions.
   * 是否对计算表达式时捕获的错误发出警告。
   */

  warnExpressionErrors: true,

  /**
   * Internal flag to indicate the delimiters have been
   * changed.
   * 用于指示分隔符已更改的内部标志
   *
   * @type {Boolean}
   */

  _delimitersChanged: true

}

/**
 * Interpolation delimiters.
 * 插值分隔符
 * We need to mark the changed flag so that the text parser
 * knows it needs to recompile the regex.
 * 我们需要标记changed标志，以便文本解析器知道它需要重新编译regex。
 *
 * @type {Array<String>}
 */

var delimiters = ['{{', '}}']
Object.defineProperty(module.exports, 'delimiters', {
  get: function () {
    return delimiters
  },
  set: function (val) {
    delimiters = val
    this._delimitersChanged = true
  }
})