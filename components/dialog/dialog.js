Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    // 弹窗类型, 默认为没有关闭icon按钮的弹窗, 'clsIcon' -- 有关闭icon按钮的弹窗
    type: {
      type: String,
      value: ''
    },
    // 弹窗按钮类型, 默认为一个按钮的弹窗, twoBtn -- 两个按钮的弹窗, noBtn -- 没有按钮
    btnType: { 
      type: String,
      value: ''
    },
    // 弹窗样式类型, 'awardWinning' - 答题竞赛
    styleType: {
      type: String,
      value: ''
    },
    // 弹窗标题
    title: {
      type: String,
      value: ''
    },
    // 弹窗内容
    content: {
      type: String,
      value: ''
    },
    // 设置按钮的属性
    openType : {
      type : String,
      value : ''
    },
    // 弹窗确认按钮文字
    cancelTxt: {
      type: String,
      value: '取消'
    },
    // 弹窗确认按钮文字
    confirmTxt: {
      type: String,
      value: '知道了'
    }
  },
  data: {
    // 弹窗显示控制
    visible: false
  },
  methods: {
    /*
      @func hide
      @desc 隐藏弹窗
    */
    hide() {
      this.setData({
        visible: false
      })
    },
    /*
      @func show
      @desc 显示弹窗
    */
    show() {
      this.setData({
        visible: true
      })
    },
    /*
     * 内部私有方法建议以下划线开头
     * triggerEvent 用于触发事件
     */
    /*
      @func _cancelEvent
      @desc 取消按钮点击事件
    */
    _cancelEvent() {
      this.hide()
      //触发取消回调
      this.triggerEvent("cancelEvent")
    },
    /*
      @func _confirmEvent
      @desc 确定按钮点击事件
    */
    _confirmEvent() {
      this.hide()
      //触发确定回调
      this.triggerEvent("confirmEvent")
    },
    /*
      @func _closeEvent
      @desc 关闭按钮点击事件
    */
    _closeEvent() {
      this.hide()
      this.triggerEvent("closeEvent")
    }
  }
})