var _ = require('../util')
var Cache = require('../cache')
var cache = new Cache(1000)
var argRE = /^[^\{\?]+$|^'[^']*'$|^"[^"]*"$/
var filterTokenRE = /[^\s'"]+|'[^']+'|"[^"]+"/g

/**
 * Parser state
 */

var str
var c, i, l
var inSingle
var inDouble
var curly
var square
var paren
var begin
var argIndex
var dirs
var dir
var lastFilterIndex
var arg

/**
 * Push a directive object into the result Array
 * 将指令对象推入结果数组
 */

function pushDir () {
  dir.raw = str.slice(begin, i).trim()
  if (dir.expression === undefined) {
    dir.expression = str.slice(argIndex, i).trim()
  } else if (lastFilterIndex !== begin) {
    pushFilter()
  }
  if (i === 0 || dir.expression) {
    dirs.push(dir)
  }
}

/**
 * Push a filter to the current directive object
 * 将筛选器推送到当前指令对象
 */

function pushFilter () {
  var exp = str.slice(lastFilterIndex, i).trim()
  var filter
  if (exp) {
    filter = {}
    var tokens = exp.match(filterTokenRE)
    filter.name = tokens[0]
    filter.args = tokens.length > 1 ? tokens.slice(1) : null
  }
  if (filter) {
    (dir.filters = dir.filters || []).push(filter)
  }
  lastFilterIndex = i + 1
}

/**
 * Parse a directive string into an Array of AST-like
 * objects representing directives.
 * 将指令字符串解析为表示指令的类似AST的对象数组。
 *
 * Example:
 *
 * "click: a = a + 1 | uppercase" will yield:
 * {
 *   arg: 'click',
 *   expression: 'a = a + 1',
 *   filters: [
 *     { name: 'uppercase', args: null }
 *   ]
 * }
 *
 * @param {String} str
 * @return {Array<Object>}
 */

exports.parse = function (s) {

  var hit = cache.get(s)
  if (hit) {
    return hit
  }

  // reset parser state
  // 重置分析器状态
  str = s
  inSingle = inDouble = false
  curly = square = paren = begin = argIndex = 0
  lastFilterIndex = 0
  dirs = []
  dir = {}
  arg = null

  for (i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i)
    if (inSingle) {
      // check single quote
      // 检查单引号
      if (c === 0x27) inSingle = !inSingle
    } else if (inDouble) {
      // check double quote
      // 检查双引号
      if (c === 0x22) inDouble = !inDouble
    } else if (
      c === 0x2C && // comma逗号
      !paren && !curly && !square
    ) {
      // reached the end of a directive
      // 到达指令的结尾
      pushDir()
      // reset & skip the comma
      // 重置并跳过逗号
      dir = {}
      begin = argIndex = lastFilterIndex = i + 1
    } else if (
      c === 0x3A && // colon冒号
      !dir.expression &&
      !dir.arg
    ) {
      // argument
      // 参数
      arg = str.slice(begin, i).trim()
      // test for valid argument here
      // since we may have caught stuff like first half of
      // an object literal or a ternary expression.
      // 在这里测试有效参数，因为我们可能捕捉到了对象文字或三元表达式的前半部分。
      if (argRE.test(arg)) {
        argIndex = i + 1
        dir.arg = _.stripQuotes(arg) || arg
      }
    } else if (
      c === 0x7C && // pipe|
      str.charCodeAt(i + 1) !== 0x7C &&
      str.charCodeAt(i - 1) !== 0x7C
    ) {
      if (dir.expression === undefined) {
        // first filter, end of expression
        // 第一个过滤器，表达式结尾
        lastFilterIndex = i + 1
        dir.expression = str.slice(argIndex, i).trim()
      } else {
        // already has filter
        // 已经有筛选器
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break // "
        case 0x27: inSingle = true; break // '
        case 0x28: paren++; break         // (
        case 0x29: paren--; break         // )
        case 0x5B: square++; break        // [
        case 0x5D: square--; break        // ]
        case 0x7B: curly++; break         // {
        case 0x7D: curly--; break         // }
      }
    }
  }

  if (i === 0 || begin !== i) {
    pushDir()
  }

  cache.put(s, dirs)
  return dirs
}

// var str = ''
// var dirs = []
// var dir = {}
// var begin = 0
// var argIndex = 0 
// var i = 0
// var inDouble = false
// var inSingle = false
// var square = 0
// var curly = 0
// var lastFilterIndex = 0
// function reset() {
//   str = ''
//   dirs = []
//   dir = {}
//   begin = 0
//   argIndex = 0 
//   i = 0
//   inDouble = false
//   inSingle = false
//   square = 0
//   curly = 0
//   lastFilterIndex = 0
// }
// exports.parse = function (s) {
//   reset()
//   str = s
//   for (i = 0, l = str.length; i < l; i++) {
//     c = str.charCodeAt(i)
//     if (inDouble) {// 双引号还未闭合
//       if (c === 0x22) {// 出现了闭合引号
//         inDouble = !inDouble
//       }
//     } else if (inSingle) {// 单引号还未闭合
//       if (c === 0x27) {// 出现了闭合引号
//         inSingle = !inSingle
//       }
//     } else if (c === 0x3A) {// 冒号:
//       var arg = str.slice(begin, i).trim()
//       if (/^[^\?\{]+$/.test(arg)) {
//         dir.arg = arg
//         argIndex = i + 1
//       }
//     } else if (c === 0x2C && square === 0 && curly === 0) {// 逗号,
//       pushDir()
//       dir = {}
//       begin = argIndex = i + 1
//     } else if (c === 0x7C && str.charCodeAt(i - 1) !== 0x7C && str.charCodeAt(i + 1) !== 0x7C) {// 管道符|
//       if (dir.expression === undefined) {// 第一次出现|
//         dir.expression = str.slice(argIndex, i).trim()
//       } else {// 非第一次出现直接push
//         pushFilter()
//       }
//       lastFilterIndex = i + 1
//     } else {
//       switch (c) {
//         case 0x22: inDouble = true; break // "
//         case 0x27: inSingle = true; break // '  
//         case 0x5B: square++; break        // [
//         case 0x5D: square--; break        // ]
//         case 0x7B: curly++; break         // {
//         case 0x7D: curly--; break         // }
//         default:
//           break;
//       }
//     }
//   }
//   pushDir()
//   console.log(JSON.stringify(dirs), dirs)
//   debugger
//   return dirs
// }
// function pushDir () {
//   dir.raw = str.slice(begin, i)
//   if (dir.expression === undefined) {// ++ 这里也需要进行判断，如果有值代表已经被过滤器分支设置过了，这里就不需要设置
//     dir.expression = str.slice(argIndex, i).trim()
//   } else {// ++ 添加过滤器
//     pushFilter()
//   }
//   dirs.push(dir)
// }
// function pushFilter() {
//   var exp = str.slice(lastFilterIndex, i).trim()
//   if (exp) {
//     var tokens = exp.match(/[^\s'"]+|'[^']+'|"[^"]+"/g)
//     var filter = {}
//     filter.name = tokens[0]
//     filter.args = tokens.length > 1 ? tokens.slice(1) : null
//     dir.filters = dir.filters || []
//     dir.filters.push(filter)
//   }
// }