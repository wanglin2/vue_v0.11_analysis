import Vue from './vue'
// Vue.transition('fade', {
//     beforeEnter: function (el) {
//         // a synchronous function called right before the
//         // element is inserted into the document.
//         // you can do some pre-styling here to avoid
//         // FOC (flash of content).
//     },
//     enter: function (el, done) {
//         // element is already inserted into the DOM
//         // call done when animation finishes.
//         $(el)
//             .css('opacity', 0)
//             .animate({
//                 opacity: 1
//             }, 1000, done)
//         // optionally return a "cancel" function
//         // to clean up if the animation is cancelled
//         return function () {
//             $(el).stop()
//         }
//     },
//     leave: function (el, done) {
//         // same as enter
//         $(el).animate({
//             opacity: 0
//         }, 1000, done)
//         return function () {
//             $(el).stop()
//         }
//     }
// })
window.vm = new Vue({
    el: '#app',
    components: {
        'my-component': {
            template: '<div>{{msg}}</div>',
            data() {
                return {
                    msg: 'hello world！'
                }
            }
        }
    }
})