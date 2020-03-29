import Base64 from 'lib/base64.js'
import CryptoJS from 'lib/crypto-js.js'
let appid = 'sheng_cai_zhi_dao_mini_program'
let appkey = 'NSCWKm1CUx2v5bbud5T41yGXeBzPG1pi' //test
// let appkey = 'x3hic6nYewAUXLMVczkb75TYEY48Q2Zn' //线上
let Util = {
  /*
    @func Toast
    @desc Toast提示
    @params {obj | string} options 选项参数/提示内容
    @params {string} options.msg 提示内容
    @params {string} [options.icon] 提示图标
    @params {number} [options.duration] 提示时间, 默认2000ms
  */
  Toast: function (options) {
    let msg = typeof options === 'string' ? options : options.msg
        
    wx.showToast({
      title: msg,
      icon: options.icon || 'none',
      duration: options.duration || 2000
    })
  },
  /*
    @func rpxToPx
    @desc rpx转换成px
    @params {int} rpx rpx单位数值
  */
  rpxToPx: function (rpx) {
    let windowWidth = wx.getSystemInfoSync().windowWidth,
          scale = windowWidth / 750 //以宽度750px设计稿做宽度的自适应
    return scale * rpx
  },
  /*
    @func setTitle
    @desc 设置页面标题
    @params {string} title 标题
  */
  setTitle(title) {
    wx.setNavigationBarTitle({
      title: title
    })
  },
  /*
    @func getUserId
    @desc 获取userid
  */
  getUserId(){
    let userId = global.userInfo.user_id || global.userInfoStorage.user_id || ''
    return userId
  },
  /*
    @func getUserPhone
    @desc 获取用户手机号
  */
  getUserPhone() {
    return global.userInfo.mobile || global.userInfoStorage.mobile || ''
  },
  /*
    @func isGoLogin
    @desc 判断是否跳转登录
  */
  isGoLogin() {
    let phone = this.getUserPhone()
    //未绑定手机号跳转登录页面
    if(!phone) {
      wx.navigateTo({
        url: '/page/pages/login/login'
      })
      return
    }
  },
  /*
    @func checkPhone
    @desc 校验手机号码是否合法
    @params {string} phone 手机号码
  */
  checkPhone: function(phone) { //校验手机号码
    let reg = /^1[3|4|5|6|7|8|9]\d{9}$/
    return reg.test(phone)
  },
  /*
    @func checkVerifyCode
    @desc 校验验证码是否合法
    @params {string} verifyCode 验证码
  */
  checkVerifyCode: function(verifyCode) { //校验验证码
    let reg = /^\d{6}$/
    return reg.test(verifyCode)
  },
  /*
    @func formatPhone
    @desc 手机号中间四位打星号
    @params {string} phone 手机号
  */
  formatPhone: function (phone) {
    let reg = /(\d{3})\d{4}(\d{4})/;
    return phone.replace(reg, '$1****$2')
  },
  /*
    @func countDown
    @desc 倒计时
    @param {int} totalSecond - 倒计时总时间，单位秒
    @param {function} intervalCb - 倒计时回调
    @param {function} clearIntervalCb - 倒计时结束回调
  */
  countDown(totalSecond, intervalCb, clearIntervalCb) {
    let startTime = (new Date().getTime()) / 1000,
        totalTime = startTime + totalSecond
    // 初始化
    typeof intervalCb === "function" && intervalCb.call(this, totalSecond)
    // 倒计时
    let t = setInterval(() => {
      let nowTime = new Date().getTime() / 1000,
          leftTime = Math.ceil(totalTime - nowTime)
      typeof intervalCb === "function" && intervalCb.call(this, leftTime, t)

      if(leftTime <= 0) {
        clearInterval(t)
        typeof clearIntervalCb === "function" && clearIntervalCb.call(this)
      }
    }, 1000)
  },
  /*
    @func touchMove
    @desc 触发touchmove事件获取手指移动信息
    @params {obj} e 事件对象
    @params {obj} options 对象参数
    @params {int} [options.startX] 可选参数, 手指触摸的水平方向位置
    @params {int} [options.startY] 可选参数, 手指触摸的垂直方向位置
  */
  touchMove: function (e, options) {
    if(!e.changedTouches.length){
      return
    }

    let moveInfo = {},
        dx = 0,
        dy = 0

    if(options.startX) {
      let moveX = e.touches[0].clientX //手指移动时水平方向位置
      dx = moveX - options.startX //手指移动的水平距离
      moveInfo.dx = dx
    }

    if(options.startY) {
      let moveY = e.touches[0].clientY //手指移动时垂直方向位置
      dy = moveY - options.startY //手指移动的垂直距离
      moveInfo.dy = dy
    }

    if(options.startX && options.startY) {
        let direction = Math.abs(dx) < Math.abs(dy) ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right') 
        console.log(direction)
        moveInfo.direction = direction
    }

    return moveInfo //手指滑动信息
  },
  /*
    @func touchEnd
    @desc 触发touchend事件获取手指移动信息
    @params {obj} e 事件对象
    @params {obj} options 对象参数
    @params {int} [options.startX] 可选参数, 手指触摸的水平方向位置
    @params {int} [options.startY] 可选参数, 手指触摸的垂直方向位置
  */
  touchEnd: function (e, options) {
    if(!e.changedTouches.length){
      return
    }

    let endInfo = {}
    if(options.startX) {
      let endX = e.changedTouches[0].clientX, //手指移动结束后水平位置
          dx = options.startX - endX
      endInfo.dx = dx
    }
    if(options.startY) {
      let endY = e.changedTouches[0].clientY, //手指移动结束后水平位置
          dy = options.startY - endY
      endInfo.dy = dy
    }
    return endInfo //触摸开始与结束，手指移动的距离
  },
  /*
    @func shareAppMessage
    @desc 小程序右上角分享
    @params {obj} [option] 分享参数对象
    @params {string} [option.title] 分享标题
    @params {string} [option.path] 分享路径
    @params {string} [option.imageUrl] 分享图片路径
  */
  /*shareAppMessage(option){
    console.log('分享');
    let obj = {
      success: (res) => {
        // 转发成功
        this.Toast('分享成功')
      },
      fail: (res) => {
        // 转发失败
        // this.Toast('分享失败, 请稍后重试')
        // console.log(res)
      }
    }
    Object.assign(obj, option)
    return obj
  },*/
  Base64: Base64.Base64,
  /*
    @func getCsrftoken
    @desc 获取csrftoken
    @param {number} timestamp - 10位时间戳 
  */
  getCsrfToken: function(timestamp) {
    let str = 'appid=' + appid + '&appkey=' + appkey + '&timestamp=' + timestamp
    let token = CryptoJS.MD5(str).toString().toLocaleLowerCase()
    let params = {
      "appid": appid,
      "timestamp": timestamp,
      "token": token
    }

    let encodeStr = encodeURIComponent(JSON.stringify(params))
    return this.Base64.encode(encodeStr)
  }
}

export default Util