import Util from '../../../js/util'
import App from '../../../app'
import Service from '../../../js/service'
import regeneratorRuntime from '../../../js/lib/runtime'
let Toast = Util.Toast,
    globalData = App.globalData

Page({
  data: {
    userPhone: '', //获取的用户绑定的手机号
    phone: '',
    verifyCode: '',
    sendCodeTxt: '获取验证码',
    leftTime: 60,
    isHideDeleteBtn: true, //是否隐藏删除按钮
    isSend: false, //是否已经发送验证码
    isLogin: false,
    requesting: false //是否在登录请求中
  },
  /*
    @func onPhoneInput
    @desc 手机号输入框输入
    @params {obj} e 事件对象
  */
  onPhoneInput(e) {
    let value = e.detail.value
    this.setData({
      phone: value
    })
    this.isLogin()
    // 显示or隐藏删除按钮
    if (value) {
      this.setData({
        isHideDeleteBtn: false
      })
    } else {
      this.setData({
        isHideDeleteBtn: true
      })
    }
  },
  /*
    @func onDeletePhone
    @desc 删除手机号
  */
  onDeletePhone() {
    this.setData({
      phone: '',
      verifyCode: '',
      isHideDeleteBtn: true
    })
  },
  /*
    @func onVerifyCodeInput
    @desc 验证码输入框输入
    @params {obj} e 事件对象
  */
  onVerifyCodeInput(e) {
    let value = e.detail.value
    this.setData({
      verifyCode: value
    })
    this.isLogin()
  },
  /*
    @func onSendVerifyCode
    @desc 发送验证码
  */
  onSendVerifyCode() {
    let phone = this.data.phone
    if (!Util.checkPhone(phone)) {
      Toast('请输入正确手机号')
      return
    }

    // 是否在倒计时中
    if (this.data.isSend) {
      return
    }

    // 发送验证码按钮
    let totalTime = 60
    this.setData({
      isSend: true,
      sendCodeTxt: totalTime + 's后重发'
    })
    // 倒计时
    Util.countDown(totalTime, (leftTime) => {
      this.setData({
        sendCodeTxt: leftTime + 's后重发'
      })
    }, () => {
      this.setData({
        isSend: false,
        sendCodeTxt: '获取验证码'
      })
    })

    // 发送验证码请求
    let params = {
      mobile: phone
    }

    Service.postData('/user/get-smscode', params).then((res) => {
      let _body = res.data
      Toast(_body && _body.msg || '请求失败，请稍后重试')
    })
  },
  /*
    @func isLogin
    @desc 是否允许登录、控制登录按钮是否高亮
  */
  isLogin() {
    let data = this.data
    this.setData({
      isLogin: data.verifyCode && data.phone
    })
  },
  /*
    @func onLogin
    @desc 登录
    @params {obj} userInfo 用户信息对象
  */
  async onLogin(userInfoTarget) {
    let errMsg = userInfoTarget.detail.errMsg
    if(this.data.requesting || !errMsg.indexOf('ok') === -1) {
      return
    }
    let phone = this.data.phone,
      verifyCode = this.data.verifyCode,
      isLogin = this.data.isLogin
      
    if (!isLogin) {
      return
    }

    //校验手机号
    if (!Util.checkPhone(phone)) {
      Toast('请输入正确手机号')
      return
    }
    //校验验证码
    if (!Util.checkVerifyCode(verifyCode)) {
      Toast('请输入正确验证码')
      return
    }

    let userId = global.userInfo.user_id
    //如果没有userid获取到userid再请求登录接口
    if(!userId) {
      let userInfo = userInfoTarget.detail.userInfo
      globalData.wxUserInfo = userInfo
      // 防止用户未授权点击登录
      if(!userInfo){
        Toast('需要授权才能登录')
        return
      }
      await App.getUserId()
      userId = global.userInfo.user_id
    }
    !this.data.userPhone && (this.data.userPhone = Util.getUserPhone())

    if(userId && phone === this.data.userPhone) {
      Toast('该手机号已登录')
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
      return
    }
    // 登录请求
    let params = {
      user_id: userId,
      mobile: phone,
      smscode: verifyCode
    }
    params.complete = () => {
      this.data.requesting = false
    }

    this.data.requesting = true
    Service.postData('/user/bind-mobile', params).then((res) => {
      let _body = res.data
      if (_body.errorcode !== 200) {
        Toast(_body && _body.msg || '请求失败，请稍后重试')
        return
      }

      Toast(_body.msg)
      global.userInfo.mobile = phone
      wx.navigateBack()
    })
  },
  /*
    @func isAuth
    @desc 判断是否授权
  */
  isAuth() {
    // 未授权or未绑定手机号则不获取用户信息
    if (globalData.isAuth || !this.data.userPhone) {
      return
    }
    wx.getSetting({
      success: (res) => { //已授权
        if (res.authSetting['scope.userInfo']) {
          globalData.isAuth = true
          //没有userid则获取userid
          if(!global.userInfo.user_id) {
            App.getUserInfo(() => {
              Toast('获取用户信息失败, 请稍后重试')
            })
          }
          return
        } 
        // 若没有授权弹窗指引授权
        // wx.showModal({
        //   title: '开启授权',
        //   content: '请点击右上角"···"-关于声财之道-右上角"···"-设置，开启授权',
        //   success: (res) => {
        //     if (res.confirm) {
        //       console.log('用户点击确定')
        //     } else if (res.cancel) {
        //       console.log('用户点击取消')
        //       wx.navigateBack()
        //     }
        //   }
        // })
      }
    })
  },
  /*
    @func onShow
    @desc 页面显示
  */
  onShow() {
    !this.data.userPhone && (this.data.userPhone = Util.getUserPhone())
    this.isAuth()
  }
})