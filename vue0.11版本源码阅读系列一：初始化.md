[TOC]

各位，你们没有看错，现在是2020年，vue3.0都已经出来了很长一段时间了，而本文将要带各位阅读的是0.11版本，也就是`vue`最早的正式版本，发布时间大概是六七年前，那时，嗯，太久远，忘了我那时在干啥，原因是2.0和3.0已经是一个很完善的框架了，代码量也很大，作为一个没啥源码阅读经验的菜鸟，我不认为我有这个能力去看懂它，但同时又很想去深入底层了解vue的实现原理，而不是总止步于看别人的文章，于面试于学习都不利，所以打算拿最早的版本来先练练手，需要先说明的是0.11版本和2.x甚至是1.x语法区别都是很大的，但是基本思想是一致的，所以我们主要聚焦于响应式原理、模板编译等关键也是比较热门的话题上，具体的api不是咱们的重点，话不多说，开始启程。

# 跑起来

0.11版本官方文档：[https://011.vuejs.org/guide/index.html](https://011.vuejs.org/guide/index.html)，仓库分支：[https://github.com/vuejs/vue/tree/0.11](https://github.com/vuejs/vue/tree/0.11)。

目录结构如下：

![image-20201229111517784](C:\Users\wanglin25\AppData\Roaming\Typora\typora-user-images\image-20201229111517784.png)

看起来是不是挺清晰挺简单的，第一件事是要能把它跑起来，便于打断点进行调试，但是构建工具用的是`grunt`，不会，所以简单的使用`webpack`来配置一下：

1.安装：`npm install webpack webpack-cli webpack-dev-server html-webpack-plugin clean-webpack-plugin --save-dev`，注意要去看看`package.json`里面是不是已经有`webpack`了，有的话记得删了，不然版本不对。

2.在`/src`目录下新建一个`index.js`文件，用来作为我们的测试文件，输入：

```js
import Vue from './vue'
new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue.js!'
    }
})
```

3.在`package.json`文件同级目录下新建一个`index.html`，输入：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>demo</title>
</head>
<body>
    <div id="app">
        <p>{{message}}</p>
        <input v-model="message">
    </div>
</body>
</html>
```

4.在`package.json`文件同级目录下新建一个`webpack`配置文件`webpack.config.js`，输入：

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.js'
  },
  devtool: 'inline-source-map',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: './dist',
    hot: true
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new HtmlWebpackPlugin({
      template: 'index.html'
    }),
  ],
};
```

5.最后配置一下`package.json`的执行命令：

```js
{
    "scripts": {
        "start": "webpack serve --hot only --host 0.0.0.0
    },
}
```

这样在命令行输入`npm start`就可以启动一个带热更新的服务了：

![image-20201229145416657](C:\Users\wanglin25\AppData\Roaming\Typora\typora-user-images\image-20201229145416657.png)

# 初始化做了什么

`Vue`的初始化工作主要是给`Vue`的构造函数和原型挂载方法和属性。

添加静态方法：

```js
function Vue (options) {
  this._init(options)
}
extend(Vue, require('./api/global'))
```

添加静态属性：

```js
Vue.options = {
  directives  : require('./directives'),
  filters     : require('./filters'),
  partials    : {},
  transitions : {},
  components  : {}
}
```

添加原型方法：

```js
var p = Vue.prototype
extend(p, require('./instance/init'))
extend(p, require('./instance/events'))
extend(p, require('./instance/scope'))
extend(p, require('./instance/compile'))
extend(p, require('./api/data'))
extend(p, require('./api/dom'))
extend(p, require('./api/events'))
extend(p, require('./api/child'))
extend(p, require('./api/lifecycle'))
```

`extend`方法很简单，就是一个浅拷贝函数：

```js
exports.extend = function (to, from) {
  for (var key in from) {
    to[key] = from[key]
  }
  return to
}
```

实例代理`data`属性：

```js
Object.defineProperty(p, '$data', {
  get: function () {
    return this._data
  },
  set: function (newData) {
    this._setData(newData)
  }
})
```

`_data`就是创建`vue`实例时传入的`data`对象。

## 替换整个data数据

上面的`_setData`方法会在重新给实例的`$data`属性赋值时调用，一般是用不上的，因为我们很少会在实例化以后整个替换`data`数据，但是还是来看一下这个函数做了什么，首先是把新数据里不存在的属性删除掉：

```js
keys = Object.keys(oldData)
i = keys.length
while (i--) {
    key = keys[i]
    if (!_.isReserved(key) && !(key in newData)) {
        this._unproxy(key)
    }
}
```

`isReserved`方法用来判断属性是不是以`$`或`_`开头的私有属性，`_unproxy`删除实例上的该属性，因为`Vue`会把`data`上的属性同时也代理到`this`：

```js
exports._unproxy = function (key) {
  delete this[key]
}
```

之后就是给新数据添加响应性：

```js
keys = Object.keys(newData)
i = keys.length
while (i--) {
    key = keys[i]
    if (!this.hasOwnProperty(key) && !_.isReserved(key)) {
        // 新属性
        this._proxy(key)
    }
}
```

`_proxy`方法就是用来把`data`上的`key`代理到`this[key]`：

```js
exports._proxy = function (key) {
  var self = this
  Object.defineProperty(self, key, {
    configurable: true,
    enumerable: true,
    get: function proxyGetter () {
      return self._data[key]
    },
    set: function proxySetter (val) {
      self._data[key] = val
    }
  })
}
```

很简单，使用`defineProperty`把`key`设置为该实例的属性，配置`getter`和`setter`方法来返回或操作`_data`的数据。

继续看`_setData`方法：

```js
oldData.__ob__.removeVm(this)
Observer.create(newData).addVm(this)
```

`Vue`会递归给`data`上的每个属性都创建一个观察者实例，创建的实例对象会设置到该值的`__ob__`属性上，所以`__ob__`指的就是该数据的观察者对象，根据第二行知道创建新观察者实例时会使用`addVm`方法收集当前的`vue`实例：

```js
// 这里的p是观察者对象实例
p.addVm = function (vm) {
  (this.vms = this.vms || []).push(vm)
}
p.removeVm = function (vm) {
  this.vms.splice(this.vms.indexOf(vm), 1)
}
```

这两个方法只有当数据对象被观察为`vue`实例的根`$data`时才会被调用，收集实例主要是用来当`$add/$delete`方法调用时能通知到对应的实例以做出相应的改变。

最后通知所有的`watcher`进行更新操作：

```js
this._digest()
```

这个`watcher`是啥后面再细说。

到这里这个`_setData`方法就结束了，上面说了，一般我们常规操作是不会触发这个方法的，再者`vue`初始化或创建实例时也不会触发，所以其实跟这个小标题没啥关系，创建`vue`实例真正的操作在`this._init(options)`方法。

## 创建vue实例时真正的初始化方法

`_init`首先定义了一堆后续需要使用的属性，包括公开的和私有的，然后会进行选项合并、初始化数据观察、初始化事件和生命周期，这之后就会调用`created`生命周期方法，如果传递了`$el`属性，接下来就会开始编译。

### 选项合并

```js
options = this.$options = mergeOptions(
    this.constructor.options,
    options,
    this
)
```

`constructor.options`就是上一节提到的那些静态属性，接下来看`mergeOptions`方法：

```js
guardComponents(child.components)
```

首先调用了`guardComponents`方法，这个方法用来处理我们传入的`components`选项，这个属性是用来注册组件的，比如：

```js
new Vue({
	components: {
        'to-do-list': {
            //...
        }
    }
})
```

组件其实也是个`vue`实例，所以这个方法就是用来把它转换成`vue`实例：

```js
function guardComponents (components) {
  if (components) {
    var def
    for (var key in components) {
      def = components[key]
      if (_.isPlainObject(def)) {
        def.name = key
        components[key] = _.Vue.extend(def)
      }
    }
  }
}
```

`isPlainObject`方法用来判断是不是纯粹的原始的对象类型：

```js
var toString = Object.prototype.toString
exports.isPlainObject = function (obj) {
  return toString.call(obj) === '[object Object]'
}
```

`vue`创建可复用组件调用的是静态方法`extend`，用来创建`Vue`构造函数的子类，为啥不直接`new Vue`呢？`extend`做了啥特殊操作呢？不要走开，接下来更精彩。

其实`extend`如字面意思继承，其实返回的也是个构造函数，因为我们知道组件是可复用的，如果直接`new`一个实例，那么即使在多处使用这个组件，实际上都是同一个，数据什么的都是同一份，修改一个影响所有，显然是不行的、

如果不使用继承的话，就相当于每使用一次该组件，就需要使用该组件选项去实例化一个新的`vue`实例，貌似也可以，所以给每个组件都创建一个构造函数可能是方便扩展和调试吧。

```js
exports.extend = function (extendOptions) {
  extendOptions = extendOptions || {}
  var Super = this
  // 创建子类构造函数
  var Sub = createClass(
    extendOptions.name ||
    Super.options.name ||
    'VueComponent'
  )
  Sub.prototype = Object.create(Super.prototype)
  Sub.prototype.constructor = Sub
  Sub.cid = cid++
  // 这里也调用了mergeOptions方法
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  )
  Sub['super'] = Super
  Sub.extend = Super.extend
  // 添加静态方法，如：directive、filter、transition等注册方法，以及component方法
  createAssetRegisters(Sub)
  return Sub
}
```

可以看到这个方法其实就是个类继承方法，一般我们创建子类会直接定义一个方法来当做子类的构造函数，如：

```js
function Par(name){
    this.name = name
}
Par.prototype.speak = function (){
    console.log('我叫' + this.name)
}
function Child(name){
    Par.call(this, name)
}
Child.prototype = new Par()
```

但是`Vue`这里使用的是`new Function`的方式：

```js
function createClass (name) {
  return new Function(
    'return function ' + _.classify(name) +
    ' (options) { this._init(options) }'
  )()
}
```

注释里的解释是：`This gives us much nicer output when logging instances in the console.`大意是方便在控制台打印。

回到选项合并方法：

```js
var key
if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
    }
}
```

因为每个`mixins`都可包含全部的选项，所以需要递归合并。

```js
for (key in parent) {
    merge(key)
}
for (key in child) {
    if (!(parent.hasOwnProperty(key))) {
        merge(key)
    }
}
function merge (key) {
    var strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
}
return options
```

然后是合并具体的属性，对不同的属性`vue`调用了不同的合并策略方法，有兴趣的可自行阅读。

### 初始化数据观察

选项参数合并完后紧接着调用了`_initScope`方法：

```js
exports._initScope = function () {
  this._initData()
  this._initComputed()
  this._initMethods()
  this._initMeta()
}
```

该方法又调用了四个方法，一一来看。

`_initData`方法及后续请移步第二篇：[vue0.11版本源码阅读系列二：数据观察]()。

`_initComputed`用来初始化计算属性：

```js
function noop () {}
exports._initComputed = function () {
  var computed = this.$options.computed
  if (computed) {
    for (var key in computed) {
      var userDef = computed[key]
      var def = {
        enumerable: true,
        configurable: true
      }
      if (typeof userDef === 'function') {
        def.get = _.bind(userDef, this)
        def.set = noop
      } else {
        def.get = userDef.get
          ? _.bind(userDef.get, this)
          : noop
        def.set = userDef.set
          ? _.bind(userDef.set, this)
          : noop
      }
      Object.defineProperty(this, key, def)
    }
  }
}
```

所做的事情就是把计算属性配置`gettter`和`setter`然后定义到实例上成为实例的一个属性，我们都知道计算属性所依赖的数据变化了它也会跟着变化，根据上述代码，似乎不太明显，但是很容易理解的一点是通过`this.xxx`在任何时候引用计算属性它是会执行对应的函数的，所以拿到的值肯定是最新的，问题就是使用了计算属性的模板如何知道要更新，目前看不出来，后续再说。

`bind`方法用来设置函数的上下文对象，一般有：`call`、`apply`、`bind`三种方法，第三种方法执行后会返回一个新函数，这里`vue`使用`apply`简单模拟了一下`bind`方法，原因是比原生更快，缺点是不如原生完善：

```js
exports.bind = function (fn, ctx) {
  return function () {
    return fn.apply(ctx, arguments)
  }
}
```

`_initMethods`就比较简单了，把方法都代理到`this`上，更方便使用：

```js
exports._initMethods = function () {
  var methods = this.$options.methods
  if (methods) {
    for (var key in methods) {
      this[key] = _.bind(methods[key], this)
    }
  }
}
```

上述方法都使用`bind`方法把函数的上下文设置为`vue`实例，这样才能在函数里访问到实例上的其他方法或属性，这就是为什么不能使用箭头函数的原因，因为箭头函数没有`this`。

### 初始化事件

`_initEvents`方法会遍历`watch`选项并调用`$watch`方法来观察数据，所以直接看`$watch`方法：

```js
exports.$watch = function (exp, cb, deep, immediate) {
  var vm = this
  var key = deep ? exp + '**deep**' : exp
  var watcher = vm._userWatchers[key]
  var wrappedCb = function (val, oldVal) {
    cb.call(vm, val, oldVal)
  }
  if (!watcher) {
    watcher = vm._userWatchers[key] =
      new Watcher(vm, exp, wrappedCb, {
        deep: deep,
        user: true
      })
  } else {
    watcher.addCb(wrappedCb)
  }
  if (immediate) {
    wrappedCb(watcher.value)
  }
  return function unwatchFn () {
    watcher.removeCb(wrappedCb)
    if (!watcher.active) {
      vm._userWatchers[key] = null
    }
  }
}
```

检查要观察的表达式是否已经存在，存在则追加该回调函数，否则创建并存储一个新的`watcher`实例，最后返回一个方法用来解除观察，所以要想理解最终的原理，还是得后续再看`Watcher`的实现。

这一步结束后就会触发`created`生命周期方法：`this._callHook('created')`：

```js
exports._callHook = function (hook) {
  var handlers = this.$options[hook]
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      handlers[i].call(this)
    }
  }
  this.$emit('hook:' + hook)
}
```

最后如果传了挂载元素，则会立即开始编译，编译相关请阅读：[vue0.11版本源码阅读系列三：模板编译]()。



