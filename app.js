import Util from 'js/util'
import Service from 'js/service'
import regeneratorRuntime from 'js/lib/runtime'
let Toast = Util.Toast
global.userInfo = {} //小程序用户信息
global.userInfoStorage = {} //小程序用户信息本地存储
global.audioManager = { //音频数据
  backgroundAudioManager: wx.getBackgroundAudioManager(), //获取背景音乐
  pageType: '', //页面类型, 'book' - 书籍, 'lesson' - 课堂
  bookId: '', //书籍id或者课堂id
  sectionId: '',
  isTipNetwork: '', //提示过是在移动网络下播放
  audioTime: 0, //音频总时长
  // onEnded: false,
  // onStop: false,
  // onPause: false,
  audioStatus: 0 //音频状态, 1-播放, 2-暂停, 3 - ended, 4 - stop
}

App({
  globalData: {
    wxUserInfo: {}, //微信用户信息
    isAuth: false //是否授权
  },
  /*
    @func getUserInfo
    @desc 获取用户信息
    @params {function} [failcallback] 获取用户信息失败回调函数
  */
  getUserInfo(failcallback) {
    wx.getUserInfo({
      lang: 'zh_CN',
      success: (res) => {
        let userInfo = res.userInfo
        // 设置全局变量
        this.globalData.wxUserInfo = userInfo
        this.getUserId()
      },   
      fail: () => {
        failcallback && failcallback(this, arguments)
      }
    })
  },
  /*
    @func getUserId
    @desc 获取用户id
  */
  async getUserId() {
    // 若存在userid则无需获取
    if(global.userInfo.user_id) {
      return
    }

    let wxUserInfo = this.globalData.wxUserInfo
    // 未获取到userInfo无法注册
    // if(!wxUserInfo.nickName) {
    //   // Toast('未开启授权或还在获取用户信息');
    //   return
    // }

    let getCode //获取微信登录api方法
    try{
      getCode = await Service.wxLogin()
    }catch(err){
      // callback(err)
    }
    let params = {
          js_code: getCode.code, //登录code
          nick_name: wxUserInfo.nickName,
          head: wxUserInfo.avatarUrl,
          region: wxUserInfo.city,
          province: wxUserInfo.province,
          country: wxUserInfo.country,
          gender: wxUserInfo.gender
        }
    // 获取用户id
    return Service.postData('/user/register-update', params, false).then((res) => {
      let _body = res.data
      if (_body.errorcode !== 200) {
        Toast(_body && _body.msg || '请求失败，请稍后重试')
        return
      }

      // 设置本地存储&全局变量
      let data = _body.data
          // userId = data.user_id,
          // phone = data.mobile
      // 同个设备换账号则清除签到数据
      if(data.user_id !== global.userInfoStorage.user_id) {
        wx.removeStorageSync('sczdSignDate')
      }
      wx.setStorage({   
        key:"sczdUserInfo",   
        data: data   
      })
      // 更新本地存储
      global.userInfo = global.userInfoStorage = data
      /*wx.setStorage({
        key:"sczdUserId",
        data: userId
      })*/
      // this.globalData.userId = userId
      /*wx.setStorage({   
        key:"sczdPhone",   
        data: phone   
      })*/
      // this.globalData.phone = phone
    }, (res) => {
      this.getUserId()
    })
  },
  /*
    @func onLaunch
    @desc 小程序初始化
  */
  onLaunch() {
    global.userInfoStorage = wx.getStorageSync('sczdUserInfo')
    // 微信授权
    wx.getSetting({
      success: (res) => {
        // 用户已授权
        if(res.authSetting['scope.userInfo']) {
          this.globalData.isAuth = true
          this.getUserInfo()
          return
        }
      }
    })

    // 获取小程序更新机制兼容
    if(!wx.canIUse('getUpdateManager')) {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
      return
    }
    // 强制更新
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      // 请求完新版本信息的回调
      if (res.hasUpdate) {}
    })
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    updateManager.onUpdateFailed(() => {
      // 新的版本下载失败
      wx.showModal({
        title: '已经有新版本了哟~',
        content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~'
      })
    })
  },
  /*
    @func onShow
    @desc 小程序显示
  */
  onShow() {
  },
  /*
    @func onHide
    @desc 小程序隐藏
  */
  onHide() {
  }
})

let appInstance = getApp()
export default appInstance
