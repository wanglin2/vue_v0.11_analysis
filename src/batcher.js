var _ = require('./util')
var MAX_UPDATE_COUNT = 10

// we have two separate queues: one for directive updates
// 我们有两个单独的队列：
// and one for user watcher registered via $watch().
// 一个用于指令更新，一个用于通过$watch（）注册的用户观察者。
// we want to guarantee directive updates to be called
// before user watchers so that when user watchers are
// triggered, the DOM would have already been in updated
// state.
// 我们希望保证在用户观察者之前调用指令更新，这样当触发用户观察者时，DOM就已经处于更新状态。
var queue = []
var userQueue = []
var has = {}
var waiting = false
var flushing = false

/**
 * Reset the batcher's state.
 * 重置批处理程序的状态。
 */

function reset () {
  queue = []
  userQueue = []
  has = {}
  waiting = false
  flushing = false
}

/**
 * Flush both queues and run the jobs.
 * 刷新两个队列并运行作业。
 */

function flush () {
  flushing = true
  run(queue)
  run(userQueue)
  reset()
}

/**
 * Run the jobs in a single queue.
 * 在单个队列中运行作业。
 *
 * @param {Array} queue
 */

function run (queue) {
  // do not cache length because more jobs might be pushed
  // as we run existing jobs
  // 不要缓存长度，因为在运行现有作业时可能会推送更多作业
  for (var i = 0; i < queue.length; i++) {
    queue[i].run()
  }
}

/**
 * Push a job into the job queue.
 * 将作业推入作业队列。
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 * 具有重复ID的作业将被跳过，除非在刷新队列时将其推入。
 *
 * @param {Object} job
 *   properties:
 *   - {String|Number} id
 *   - {Function}      run
 */

exports.push = function (job) {
  var id = job.id
  if (!id || !has[id] || flushing) {
    if (!has[id]) {
      has[id] = 1
    } else {
      has[id]++
      // detect possible infinite update loops
      // 检测可能的无限更新循环
      if (has[id] > MAX_UPDATE_COUNT) {
        _.warn(
          'You may have an infinite update loop for the ' +
          'watcher with expression: "' + job.expression + '".'
        )
        return
      }
    }
    // A user watcher callback could trigger another
    // directive update during the flushing; at that time
    // 用户观察者回调可能会在刷新期间触发另一个指令更新；
    // the directive queue would already have been run, so
    // 指令队列应该已经运行了，
    // we call that update immediately as it is pushed.
    // 因此，我们在推送时立即调用该更新。
    if (flushing && !job.user) {
      job.run()
      return
    }
    ;(job.user ? userQueue : queue).push(job)
    if (!waiting) {
      waiting = true
      _.nextTick(flush)
    }
  }
}