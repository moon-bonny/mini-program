import regeneratorRuntime from '../../js/lib/runtime'
import Util from '../../js/util'
import Service from '../../js/service'
const userId = Util.getUserId()
const audioManager = global.audioManager
const BAM = audioManager.backgroundAudioManager
//audioManager.audioStatus 音频状态, 1-播放, 2-暂停, 3 - ended, 4 - stop
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShowAudio: { //是否显示播放控件
      type: Boolean,
      value: true
    },
    isShowPlayCtrl: { // 判断是从是不是右下角悬浮，false是右下加悬浮，true为播放页面
      type: Boolean,
      value: false
    },
    pageType: { // 组件类型，不传默认听书, 'lesson' - 声财课堂, 'book' - 听书
      type: String,
      value: ''
    },
    bookId: { // 书id或章节id
      type: String,
      value: ''
    },
    sectionId: { // 章节id
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    audioUrl: { // 音频url
      type: String,
      value: '',
      observer(val) {
        if(audioManager.audioStatus === 3) { //end事件
          this.setGlobalAudioData() //设置全局音频播放数据
          // BAM.play()
        }
      }
    },
    duration: { //音频学习进度
      type: Number,
      value: 0,
      observer(val) {
        if(audioManager.audioStatus === 3) { //end事件
          this.setAudioStartTime(val)
        }
      }
    },
    tag: {
      type: String,
      value: '',
      observer(val) {
        this.data.tag = val
      }
    },
    is_share: { // 是否分享过
      type: Number,
      value: 0,
      observer(val) {
        this.data.is_share = val
      }
    },
    isPageVideo : { // 页面上有没有video
      type : Boolean,
      value : false
    },
    isTransY: { // 页面底部有tab的页面按钮位置上移
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    sliderVal: 0, //当前进度
    comeFromHistory: false,//
    playState: false, //控制悬浮按钮播放状态
    overTime: '--', //当前播放时间
    totalTime: '--', //音频总时长
    audioTime: 0, 
    canSlider: true,//是否能拖动进度条
    sharingFree: false//是否是分享免费
    // isPlayEnd: false,
    // isMovingSlider : true
  },
  ready() {
    this.networkDialog = this.selectComponent("#networkDialog")
    // this.initPlayState()
  },
  /*
  * 注意事项
  *BAM.src获取路径时，当没有设置过播放路径的时候，有些安卓机型会返回undefined，有些机型返回''
  *BAM.paused ios下返回0和1，安卓下返回true和false
  *BAM.seek() 有30毫秒延时，同时在播放下设置才有效
  *BAM.onPlay() 事件只能监听一次，如果写多个事件监听，后者会覆盖前者
  *BAM.src="http://mp3.com/mp3" 如果正在播放中，需要切换新的路径，首先要BAM.stop(),不然有些机型会失效
  *BAM.onTimeUpdate 不能用这个来设更新当前播放时间 ,ios下隔离的时长不一样，有时候1.5s设置更新一下，有的时候0.8s设置下更新，这个体验不好, 安卓下不知道为什么，这个触发的时候有的时候会慢几秒，是机器卡还是其他原因，不太清楚
  *async await使用的时候要注意的
  */ 
  methods: {
    /*
      @func setGlobalAudioData
      @desc  设置全局音频数据
    */
    setGlobalAudioData() {
      audioManager.bookId = this.data.bookId
      audioManager.sectionId = this.data.sectionId
      audioManager.pageType = this.data.pageType
    },
    /*
      @func initPlayState
      @desc  初始化播放状态
      @params {obj} data 从历史记录或是请求的数据
    */
    async initPlayState(isOnLoad = true) {
      let _data = this.data
      let url = await this.getAudioUrl() //获取url是一个异步的过程
      if (_data.isShowPlayCtrl) { //播放页面
        this.addEvent() //为播放器增加事件
        this.handlePlayPage(url)  //处理播放页面
      } else { //右下角悬浮
        this.initPlayHistory(isOnLoad)
      }
    },
    /*
      @func handlePlayPage
      @desc 当前页面
      @params {string} url 当前播放的url，用来判断是否是暂停或是播放
    */
    handlePlayPage(url) {
      // 获取音频的数据
      let pageType = this.data.pageType,
          requestVer = 1,
          // requestUrl = '/book/get-audio-detail',
          requestUrl = '/book/get-section-detail',
          params = {
            section_id: this.data.sectionId,
            user_id: userId || Util.getUserId()
          }
      switch(pageType) {
        case 'lesson':
          requestUrl = '/lesson/get-section-info'
          // params.book_id = this.data.bookId
          break
        default:
          params.book_id = this.data.bookId
          requestVer = 2
          break
      }
      let requestOpt = {
        version: requestVer
      }
      Service.postData(requestUrl, params, requestOpt).then((res) => {
        if (res.data.errorcode != 200) { //判断一下这本书是不是存在，如果不存在，从哪里来返回那里去
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          })
          setTimeout(() => {
            wx.navigateBack() //返回上一页
          }, 2000)
          return
        }
        let data = res.data.data
        this.setData({ ...data })
        // this.data.tag = '分享免费'
        // this.data.is_share = 0
        // 触发自定义getBookData事件，设置页面的数据
        this.triggerEvent('getBookData', { ...data })
        if (url) {  //先判断是否有url，有url了才能继续往下判断是否是在暂停或是播放
          this.handlePlaying() 
        } else {  //没有播放，需要设置url
          this.handleNotPlaying()
        }
      }, (res) => {
        wx.showToast({
          title: res.data.msg,
          icon: 'none',
          duration: 2000
        })
        setTimeout(() => {
          wx.navigateBack() //返回上一页
        }, 2000)
      })
    },
    /*
      @func handlePlaying
      @desc 正在播放的时候
    */
    async handlePlaying() {
      if (this.isFreeToJudge()) { //正在播放的时候，如果遇到分享免费的或是其它播放不了的，首先停止
        audioManager.sectionId = ''
        BAM.stop()
        await this.sleep(100)
        this.setData({
          overTime: '--',
          totalTime: '--'
        })
        return
      }
      
      let sectionId = this.data.section_id || this.data.sectionId
      let playingSectionId = audioManager.sectionId //获取正在播放的sectionId
      audioManager.audioTime = this.data.audioTime = await this.getDuration() //获取音频总时长
      this.handlePlayTime() //设置总音频时间
      await this.sleep(100)
      if (this.isPlaying()) { //正在播放
        if (sectionId != playingSectionId) { //判断下当前页面的sectionId是不是与正在播放的的id相等,如果不相等则直接设置新路径进行播放
          this.setPlayAttr(true) //设置播放器的url、title、cover
        } else {  //如果相等，则停留在该页面，获取音频的长度，和当前的时间,并且设置倒计时
          this.setData({
            playState: true,
            canSlider: false
          })
          // audioManager.audioStatus = 1
          this.setOverTime() //设置时间，如果不设置调用该方法，等到this.countDown()调用也能正确显示，但是会看到页面上慢一秒
          this.countDown() //每秒更新当前播放时间
          this.conutSliderDown() //每秒更新进度条
          this.setSliderLen() //设置进度条长度
        }
      } else {  //暂停
        if (sectionId != playingSectionId) { //判断下当前页面的sectionId是不是与正在播放的的id相等，如果不相等则直接设置新路径进行播放
          this.setPlayAttr(true)
        } else { //如果相等，则停留在该页面，获取音频的长度，和当前的时间
          this.setData({
            playState: false,
            canSlider: false
          })
          // audioManager.audioStatus = 2

          this.setOverTime() //设置时间 
          this.setSliderLen(Math.floor(BAM.currentTime)) //设置进度条
        }
      }
      this.setGlobalAudioData()
    },
    /*
      @func handleNotPlaying
      @desc 没有任何播放的时候
    */
    handleNotPlaying(isSwitch = false) {
      if (!Util.getUserId() || this.isFreeToJudge()) {
        return
      }
      // if (this.isFreeToJudge()) {  //需要分享或是要其它动作才能播放
      //   // this.triggerEvent('onShowDialog')
      //   return
      // }
      //免费播放，能直接播放 
      this.judgeNetworkType(isSwitch)
    },
    /*
      @func onPlayVoice
      @desc 点击播放、暂停按钮
    */
    onPlayVoice() {
      if (!Util.getUserId()) {
        // this.data.isNoLogin = true
        Util.isGoLogin() //判断是否登录
        return
      }
      // 点击前判断下是否是播放结束
      if (audioManager.audioStatus === 3) {
        this.data.duration = 0
        this.setData({ sliderVal: 0 })
      }
      // 播放前判断是否已经分享过
      if (this.isFreeToJudge()) {
        return
      }
      this.judgeNetworkType()
    },
    /*
      @func onTouchstart
      @desc 用户按下进度条的时候
    */
    onTouchstart() {
      // this.data.isMovingSlider = false
      clearInterval(this.data.sliderTimer)
    },
    /*
      @func onSliderTouchend
      @desc 用户手指离开进度条的时候
    */
    onSliderTouchend() {
      // this.data.isMovingSlider = true
    },
    /*
      @func onJumpHistory
      @desc 用户点击历史记录按钮跳到历史记录页面
    */
    onJumpHistory() {
      //没有userid则跳转登录
      if (!Util.getUserId()) {
        Util.isGoLogin()
        return
      }
      let audioType = this.data.pageType === 'lesson' ? 2 : 1
      wx.redirectTo({
        url: '/page/pages/readingHistory/readingHistory?audioType=' + audioType
      })
    },
    /*
      @func firstReadReward
      @desc 请求首读奖励接口
    */
    firstReadReward() {
      let audioType = this.data.pageType === 'lesson' ? 2 : 1
      let params = {
        user_id: userId || Util.getUserId(),
        book_id: audioManager.bookId,
        section_id: audioManager.sectionId,
        audio_type: audioType
      },
      requestOpt = {
        version: 3
      }

      Service.postData('/book/finish-reading-task', params, requestOpt).then((res) => {
        let _body = res.data
      })
    },
    /*
      @func addEvent
      @desc 为音频增加事件, 在播放之前只能添加一次, 后面添加会覆盖掉之前的事件
    */
    addEvent() {
      // 监听音乐播放事件
      BAM.onPlay(async () => {
        let duration = await this.getDuration() //获取音频总时长
        // 音频播放触发自定义事件
        this.triggerEvent('audioplay')

        this.setData({
          playState: true
        })
        audioManager.audioStatus = 1

        // 判断是右下角悬浮还是播放页面
        if (this.data.isShowPlayCtrl) {
          this.setData({
            canSlider: false
          })
          if (!this.data.audioTime) {
            this.setData({
              overTime: this.formatTime(this.data.duration)
            })
          }
          this.data.audioTime = duration
          this.handlePlayTime() //设置总音频时间
          this.countDown() //设置当前播放时间
          this.conutSliderDown() //设置当前进度条
          if (!this.data.firstPlay) {  //这个只需要在播放的时候调用一次即可，如果不调用也行，就是看到页面显示的效果会慢一秒，只调用一次，是因为拖动进度条的时候，滑块会马上回到原来的位置，然后1秒后再回来
            this.data.firstPlay = true
            this.setSliderLen()
            this.setOverTime()
          }

          if(audioManager.audioStatus !== 1) { //非播放中才设置全局变量
            // this.setGlobalAudioData() //设置全局音频播放数据
          }
          this.setAudioPlayDuration() //设置播放记录
        } else {
          this.data.audioTime = duration
          this.setData({
            audioTime: duration
          })
          // if (this.data.duration >= duration) {
          // 判断一下历史记录播放时间是不是大于或等于总时长，如果是的话就从头播放
          if (this.data.duration >= duration) {
            this.data.duration = 0
            this.setPlayAttr(true)
          }
          // 判断一下页面上有没有video，如果有的话，在播放的时候暂停视频
          if (this.data.isPageVideo) {
            this.videoContext = wx.createVideoContext('playVideo')
            this.videoContext.pause()
          }
          this.setData({ iconPlayImage: true })
        }

        setTimeout(() => {
          wx.hideNavigationBarLoading()
          wx.hideLoading()
        }, 200)
      })
      // 监听音乐暂停事件
      BAM.onPause(() => {
        // 音频暂停触发自定义事件
        this.triggerEvent('audiopause')

        this.setData({ playState: false })
        audioManager.audioStatus = 2

        if (this.data.isShowPlayCtrl) {
          clearInterval(this.data.timer) //关闭当前时间时间定时器
          clearInterval(this.data.sliderTimer)//关闭当前滑块定时器
          this.setAudioPlayDuration()
        } else {
          this.setData({ iconPlayImage: false })
        }
        wx.hideNavigationBarLoading()
        wx.hideLoading()

      })
      // 监听音乐停止事件, 音频正常播放完毕
      BAM.onEnded(() => {
        // 音频停止触发自定义事件
        this.triggerEvent('audioended')

        this.firstReadReward()
        this.setData({ playState: false })
        audioManager.audioStatus = 3

        if (this.data.isShowPlayCtrl) {
          // this.data.onEnded = true
          clearInterval(this.data.timer) //关闭当前时间时间定时器
          clearInterval(this.data.sliderTimer) //关闭当前滑块定时器
          this.setOverTime()
          this.setSliderLen()
        } else {
          this.setData({ iconPlayImage: false })
        }

        this.data.duration = 0
        this.setAudioPlayDuration()
        wx.hideNavigationBarLoading()
        wx.hideLoading()
      })
      // 监听音乐停止事件, 用户被迫停止音频
      BAM.onStop(() => {
        audioManager.audioStatus = 4
        // 音频停止触发自定义事件
        this.triggerEvent('audiostop')

        this.setData({ playState: false })
        if (this.data.isShowPlayCtrl) {
          clearInterval(this.data.timer) //关闭当前时间时间定时器
          clearInterval(this.data.sliderTimer) //关闭当前滑块定时器
          this.setData({
            overTime: '00:00',
            sliderVal: 0
            // onStop: true
          })
          this.setAudioPlayDuration()
        } else {
          this.setData({ iconPlayImage: false })
        }

        wx.hideNavigationBarLoading()
        wx.hideLoading()
      })
      // BAM.onCanplay(() => { //这个事件不会触发
      //   this.setSliderLen(Math.floor(BAM.currentTime))
      // })
      // BAM.onTimeUpdate(async () => {
      //不能用这个来设置当前的播放时间 ,ios下隔离的时长不一样，有时候1.5s设置更新一下，有的时候0.8s设置下更新，这个体验不好, 安卓下不知道为什么，这个触发的时候有的时候会慢几秒，是机器卡还是其他原因，不太清楚，
      // if (this.data.isMovingSlider){
      //   if (this.data.isPlayEnd){
      //     this.data.isPlayEnd = false
      //     await this.sleep(100)
      //   }
      //   // this.setOverTime()
      //   this.setSliderLen()
      // }
      // })
      // 监听音乐播放出错事件
      BAM.onError((error) => {
        wx.showToast({
          title: '音频播放失败',
          icon: 'success',
          duration: 2000
        })
      })
      // 监听音乐缓存事件
      BAM.onWaiting(() => {
        wx.showNavigationBarLoading()
        wx.showLoading({
          title: '音频正在加载中...'
        })
      })
    },
    /*
      @func isFreeToJudge
      @desc 判断是否是分享免费
      return boolean
    */
    isFreeToJudge() {
      let isShow = this.data.is_share == 0 && this.data.tag == '分享免费' && Util.getUserId()
      if (isShow) {
        this.triggerEvent('onShowDialog')
      }
      return isShow
    },
    /*
     @func setPlayAttr
     @desc 获取音频title
     @params {Boolean} isSwitch 是否是切换音频的src
   */
    async setPlayAttr(isSwitch = false, isSliderChange = false) {
      //音频stop或end或需要切换或没有src
      if (!BAM.src || isSwitch || audioManager.audioStatus === 4 || audioManager.audioStatus === 3 || this.data.sectionId !== audioManager.sectionId) {
        if (isSwitch || audioManager.audioStatus === 4 || this.data.sectionId !== audioManager.sectionId) {
          // let sysInfo = await this.getSystemInfo()
          // if (sysInfo == 'ios') {
          //   BAM.stop()
          // } else {
          //   BAM.src = '/'
          // }
          BAM.stop()
          await this.sleep(100)
          this.setData({
            overTime: '--',
            totalTime: '--'
          })
        }

        this.setAudioTitle(this.data.title) //设置title
        if(!this.data.audioUrl) { //音频播放页        
          this.setAudioEpname(this.data.author) //设置歌手名
          this.setAudioSinger(this.data.title) //设置专辑名
          this.setAudioCoverImgUrl(this.data.cover) //设置封面
        }

        if (audioManager.audioStatus === 3) { //音频自动播放完毕
          // this.data.duration = 0
          //用户拖动进度条
          !isSliderChange && this.setAudioStartTime(0)
          isSliderChange && this.setAudioStartTime(this.data.duration)
          // this.setAudioStartTime(0)
        }else { //判断之前用户听到那里，如果没有就是0,有的话就设置播放的开始时间
          this.data.duration && this.setAudioStartTime(this.data.duration)
        }
        // if (this.data.duration) { //判断之前用户听到那里，如果没有就是0,有的话就设置播放的开始时间
        //   this.setAudioStartTime(this.data.duration) //设置播放的开始时间
        // }
        this.setAudioUrl(this.data.audio || this.data.audioUrl) //设置音频的路径
        wx.showNavigationBarLoading()
        wx.showLoading({
          title: '音频正在加载中...'
        })
        // BAM.play()
      }

      // if (audioManager.onEnded) {
      //   this.data.duration = 0
      //   this.setAudioStartTime(this.data.duration)
      //   // this.setAudioStartTime(0)
      // }
      this.setGlobalAudioData()
      let paused = !!BAM.paused
      if (paused == true && BAM.src !== '') {
        BAM.play()
      } else if (paused == false && BAM.src !== '') {
        BAM.pause()
      }
      this.setData({ iconPlayImage: !paused })
    },
    /*
      @func initPlayHistory
      @desc 初始化右下角悬浮按钮
    */
    async initPlayHistory(isOnLoad = true) {
      // await this.sleep(10)
      // 初始化页面的时候，判断一下是不是存在src
      if (BAM.src) {
        // 如果存在，根据是否暂停设置右下角的图片
        this.setData({ iconPlayImage: !BAM.paused })
      } else {
        this.setData({ iconPlayImage: false })
      }
      //章节列表自动播放
      if(this.data.audioUrl) {
        switch(audioManager.audioStatus) {
          case 0: //初始化状态
          case 3: //stop
          case 4: //end
            // this.setAudioUrl(this.data.audioUrl)
            // this.data.duration && this.setAudioStartTime(this.data.duration)
            // this.setPlayAttr(true)
            // this.setGlobalAudioData()
            this.handleNotPlaying(true)
            break
          case 1: //播放中
            this.handlePlaying()
            break
          case 2: //暂停
            if(isOnLoad) {
              this.handleNotPlaying()
            }
            break
        }
      }
      this.addEvent()
    },

    /*
      @func onPlayHistory
      @desc 处理每个页面右下角的悬浮按钮
    */
    async onPlayHistory() {
      if (!Util.getUserId()) {
        Util.isGoLogin() //判断是否登录
        return
      }
      if (BAM.src) {
        // 有的安卓手机在这里需要等待一下不然获取BAM.paused在播放下也是true，为什么要取反，因为安卓下返回的是true和false，ios下返回的是0和1
        await this.sleep(100)
        if (!!BAM.paused == true) {  //判断下是否是暂停，如果是暂停的话就就行播放，如果是播放的话直接跳到听书页面
          if (audioManager.audioStatus === 3) {
            this.data.duration = 0
            await this.getHistoryData()
            BAM.src = this.data.audio
          } else if (audioManager.audioStatus === 4) { //如果是触发了stop事件，需要重新设置src，不然播放有问题
            await this.getHistoryData()
            this.setPlayAttr()
          } else {
            BAM.play()
          }
          this.setData({ iconPlayImage: false })
          return
        }
        // 跳到播放页面
        wx.navigateTo({
          url: '/page/pages/listenBook/listenBook?pageType='+ audioManager.pageType +'&id='+ audioManager.bookId +'&sectionId=' + audioManager.sectionId
        })
        return
      }
      // 获取最近播放数据
      await this.getHistoryData()
    },
    /*
      @func getHistoryData
      @desc 获取播放历史纪录数据
    */
    async getHistoryData() {
      if (!this.data.userId) {
        this.data.userId = Util.getUserId()
      }
      let params = {
            user_id: this.data.userId,
            is_audio_only: 1
          },
          requestOpt = {
            isShowLoader: false,
            version: 2
          }
      return Service.postData('/user/get-latest-audio', params, requestOpt).then((res) => {
        let data = res.data
        let title = '你最近没有导读足迹哦~~'
        if (data.errorcode == 200) {
          data = data.data.list[0]
          if (data) {
            if (data.status == 1){
              audioManager.bookId = this.data.bookId = data.book_id
              audioManager.sectionId = this.data.sectionId = data.section_id
              audioManager.pageType = this.data.pageType = data.type === 1 ? 'book' : 'lesson'
              // this.handlePlayHistory(data)
              this.setData({ ...data })
              // this.data.duration = 277
              this.judgeNetworkType()
              return
            }
            title = '该书不存在'
          } else {
            let title = '你最近没有导读足迹哦~~'
          }
        } else {
            title = '播放失败，请重新尝试~~'
        }
        wx.showToast({
          title: title,
          icon: 'none',
          duration: 2000
        })
      })
    },
    /*
      @func _cancelEvent
      @desc 点击取消按钮
    */
    _cancelEvent() {
      this.networkDialog.hide()
    },
    /*
      @func _confirmEvent
      @desc 点击确定按钮
    */
    _confirmEvent() {
      audioManager.isTipNetwork = true
      this.setPlayAttr()
      this.networkDialog.hide()
    },
    /*
      @func judgeNetworkType
      @desc 判断网络状态
    */
    async judgeNetworkType(isSwitch = false) {
      // 判断一下是否提示过是在移动网络下播放
      if (audioManager.isTipNetwork) {
        this.setPlayAttr(isSwitch)
        return
      }

      let getNetworkType = null
      try {
        // 获取当前的网络状态
        getNetworkType = await this.getNetworkType()
      } catch (e) {
        // 获取网络状态失败时，直接播放
        this.setPlayAttr(isSwitch)
        return
      }

      if (getNetworkType.errMsg == 'getNetworkType:ok' && getNetworkType.networkType == 'wifi') {
        // 在WiFi下直接播放
        this.setPlayAttr(isSwitch)
      } else {
        // 在移动网络状态下提示弹出，这里不能用原生的弹窗，因为原生的弹窗弹出来后不进行任何的处理，直接点击返回按钮的时候，系统会默认点击了确定按钮
        this.networkDialog.show()
      }
    },
    /*
      @func getNetworkType
      @desc 获取网络状态
      @return Promise
    */
    getNetworkType() {
      return new Promise((resolve, reject) => {
        wx.getNetworkType({
          success: function (res) {
            // 返回网络类型, 有效值：
            // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
            resolve(res)
          },
          fail: () => {
            reject()
          }
        })
      })
    },
    /*
      @func setAudioPlayDuration
      @desc 向服务端发送播放记录
    */
    setAudioPlayDuration() {
      // let data = this.data
      // 如果是分享免费且用户没分享过
      let isShare = this.data.is_share === 0 && this.data.tag == '分享免费' 
      if (isShare || ((BAM.src == undefined || BAM.src == '' || !audioManager.sectionId) && !audioManager.audioStatus === 3)) {
        return
      }
      let currentTime = parseInt(BAM.currentTime) || 0
      if (audioManager.audioStatus === 3) {
        currentTime = audioManager.audioTime
      }
      let audioType = audioManager.pageType === 'lesson' ? 2 : 1
      let params = {
            section_id: audioManager.sectionId,
            user_id: userId || Util.getUserId(),
            duration: currentTime,
            audio_type: audioType
          },
          requestOpt = {
            isShowLoader: false,
            version: 2
          }
      return Service.postData('/book/add-section-audio-log', params, requestOpt)
    },
    /*
      @func handlePlayTime
      @desc 处理音频总时长
    */
    async handlePlayTime() {
      this.setData({
        totalTime: this.formatTime(this.data.audioTime)
      })
    },
    /*
      @func formatTime
      @desc 格式化事件
      @params {number} s 时间
    */
    formatTime(s) {
      var Minute = parseInt(s / 60);
      var Second = Math.floor(Math.floor(s % 60));
      return `${this.addZone(Minute)}:${this.addZone(Second)}`
    },

    /*
      @func setOverTime
      @desc 设置当前时间
      @params {number} s 时间
    */
    setOverTime(s) {
      let current = Math.ceil(BAM.currentTime)
      if (current >= this.data.audioTime) {
        current = this.data.audioTime
      }
      let time = this.formatTime(s ? s : current)
      this.setData({
        overTime: time
      })
    },

    /*
      @func setSliderLen
      @desc 设置进度条
      @params {number} [v] 进度条长度
    */
    setSliderLen(v) {
      let current = Math.floor(BAM.currentTime)
      this.setData({
        sliderVal: this.secondToSliderLen(v ? v : current)
      })
    },

    /*
      @func conutSliderDown
      @desc 设置每一秒进度条走的长度
    */
    conutSliderDown() {
      clearInterval(this.data.sliderTimer)
      this.data.sliderTimer = setInterval(() => {
        this.setSliderLen()
      }, 1000)
    },

    /*
      @func countDown
      @desc 设置当前走过的时间
    */
    countDown() {
      clearInterval(this.data.timer)
      this.data.timer = setInterval(() => {
        this.setOverTime()
      }, 1000)
    },

    /*
      @func onSliderTouchstart
      @desc 用户按下进度条的时候
    */
    onSliderTouchstart() {
      // BAM.pause()
      clearInterval(this.data.sliderTimer)
    },

    /*
      @func onSliderChange
      @desc 用户拖动进度条的时候
    */
    async onSliderChange(e) {
      let val = e.detail.value
      if (val == 0) {
        val = this.secondToSliderLen(1) //时间转进度条长度
      }
      let len = this.sliderLenToSecond(val) //进度条的长度转时间
      if (audioManager.audioStatus === 3) { //如果播放已经结束了，用户拖动进度条
        this.data.duration = len
        this.setPlayAttr(true, true)
      } else {
        if (!!BAM.paused) { //在暂停下必须要先播放再设置时间，否则设置后不会有效
          BAM.play()
          await this.sleep(50)
        }
        this.setAudioSeek(len) //设置播放时间，
        this.setOverTime(this.sliderLenToSecond(val))

        let time = await this.handleBuffered(len) //获取缓冲数据
        BAM.play()
        // 这两个在这里调用时因为当音频全部缓冲了之后，拖动设置它的时间，不会触发onPlay
        setTimeout(() => {
          wx.hideNavigationBarLoading()
          wx.hideLoading()
        }, 100)
      }
    },
    /*
      @func handleBuffered
      @desc 拖动进度条的时候判断是否可以播放，如果可以，就播放，如果不可以，就一直轮询
      @params {number} len 当前拖动到某个位置后转换成的秒数
    */
    handleBuffered(len) {
      let buffered = this.getAudioBuffered()
      let timer = null, _this = this
      return new Promise((resolve, reject) => {
        if (buffered >= len) {
          resolve(buffered)
        } else {
          ; (function getBuffer() {
            clearTimeout(timer)
            timer = setTimeout(() => {
              let b = _this.getAudioBuffered()
              if (b >= len) {
                clearTimeout(timer)
                resolve(b)
              } else {
                getBuffer()
              }
            }, 100)
          })()

        }
      })
    },
    /*
      @func secondToSliderLen
      @desc 时间转进度条长度
      @params {number} current 当前播放时间
    */
    secondToSliderLen(current) {
      return current * (1000 / this.data.audioTime)
    },

    /*
      @func sliderLenToSecond
      @desc 进度条长度转时间
      @params {number} current 当前进度长度
    */
    sliderLenToSecond(v) {
      return v / (1000 / this.data.audioTime)
    },

    /*
      @func addZone
      @desc 小于10的书补0
      @params {number} n 自然数
    */
    addZone(n) {
      return n < 10 ? '0' + n : n
    },

    /*
      @func setPlayData
      @desc 设置this.data的数据，让视图同步更新
      @params {String}  key 符合json的key值
      @params {Any} v 任意类型
    */
    setPlayData(k, v) {
      this.setData({
        [k]: v
      })
    },
    /*
      @func isPlaying
      @desc 是否是播放
    */
    isPlaying() {
      return !!BAM.paused == false
    },

    /*
     @func isPaused
     @desc 是否是暂停
   */
    isPaused() {
      return !!BAM.paused == true
    },

    /*
      @func getPlayAudioUrl
      @desc 获取正在播放的url路径
    */
    getPlayAudioUrl() {
      return BAM.src
    },

    /*
      @func getPlayAudioTitle
      @desc 获取音频title
    */
    getPlayAudioTitle() {
      return BAM.title
    },

    /*
      @func getDuration
      @desc 获取音频总时长
    */
    getDuration() {
      return new Promise((resolve, reject) => {
        let timer = null, num = 0
          ; (function getDura() {
            if (++num > 20) {
              clearTimeout(timer)
              resolve(false)
              return
            }
            let d = BAM.duration ? Math.floor(BAM.duration - 1) : 0 
            if (d) {
              resolve(d)
            } else {
              clearTimeout(timer)
              timer = setTimeout(() => {
                if (d) {
                  clearTimeout(timer)
                  resolve(d)
                } else {
                  getDura()
                }
              }, 100)
            }
          })()
      })
    },

    /*
      @func setAudioUrl
      @desc 甚至音频url
    */
    setAudioUrl(url) {
      BAM.src = url
    },

    /*
      @func setAudioTitle
      @desc 设置音频title
    */
    setAudioTitle(title) {
      BAM.title = title
    },

    /*
      @func getAudioUrl
      @desc 获取音频url
    */
    getAudioUrl() {
      let num = 0
      let timer = null
      return new Promise((resolve, reject) => {
        (function getUrl() {
          if (BAM.src) {
            clearTimeout(timer)
            resolve(BAM.src)
          } else {
            timer = setTimeout(() => {
              if (++num > 10) {
                clearTimeout(timer)
                resolve(false)
              } else {
                getUrl()
              }
            }, 50)
          }
        })()
      })
    },

    /*
      @func setAudioEpname
      @desc 获取音频专辑名
    */
    setAudioEpname(epname) {
      BAM.epname = epname
    },

    /*
      @func setAudioSinger
      @desc 获取音频歌手
    */
    setAudioSinger(singer) {
      BAM.singer = singer
    },

    /*
      @func setAudioCoverImgUrl
      @desc 设置音频封面
       @params {string} coverImgUrl 音频封面
    */
    setAudioCoverImgUrl(coverImgUrl) {
      BAM.coverImgUrl = coverImgUrl
    },
    /*
      @func setAudioSeek
      @desc 设置播放到哪里
      @params {number} s 时间
    */
    setAudioSeek(s) {
      BAM.seek(parseInt(s))
    },

    /*
      @func setAudioStartTime
      @desc 设置音频开始播放时间，只能设置一次
      @params {string} s 时间
    */
    setAudioStartTime(s) {
      // 如果同一个播放地址url，设置该值无效,如需设置，首先调用BAM.stop(),再延时设置正在的路径
      BAM.startTime = s
    },
    /*
      @func getAudioBuffered
      @desc 获取音频的缓存点
    */
    getAudioBuffered() {
      return BAM.buffered
    },
    /*
      @func getSystemInfo
      @desc 判断手机系统
    */
    getSystemInfo() {
      return new Promise((resolve, reject) => {
        wx.getSystemInfo({
          success: function (res) {
            resolve(res.platform)
          }
        })
      })

    },
    /*
      @func sleep
      @desc 休眠长时间继续往下执行
      @params {string} time时间
    */
    sleep(time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, time)
      })
    }
  }
})
