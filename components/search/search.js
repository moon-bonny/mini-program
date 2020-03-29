import Util from '../../js/util'
let Toast = Util.Toast
Component({
  properties: {
    keyword: String
  },
  data: {
    inputVal: "",
    isShowInput: false,
    isShowMoreBlock: false, //是否显示加载更多模块
    loadMore: true, //是否加载更多 true-加载更多
    noData: false //没有数据
  },
  methods: {
    /*
      @func showInput
      @desc 显示输入框
    */
    showInput() {
      this.setData({
        isShowInput: true
      })
    },
    /*
      @func onCancel
      @desc 点击取消
    */
    onCancel() {
      this.setData({
        inputVal: "",
        isShowInput: false
      })
      wx.navigateBack()
    },
    /*
      @func onClearInput
      @desc 清空输入框
    */
    onClearInput() {
      this.setData({
        inputVal: ""
      })
    },
    /*
      @func onInput
      @desc 当输入框输入文字的时候
      @params {obj} e 事件对象
    */
    onInput(e) {
      this.setData({
        inputVal: e.detail.value
      })
    },
    /*
      @func onSearch
      @desc 点击键盘搜索按钮的时候
      @params {obj} e 事件对象
    */
    onSearch(e) {
      if (!this.data.inputVal) {
        Toast('请输入搜索内容')
        return
      }
      this.properties.keyword = this.data.inputVal
      //触发取消回调 
      this.triggerEvent("search")
    },
    /*
      @func setListStatus
      @desc 设置状态数据
      @params {string} status_obj 状态数据对象
      @params {boolean} status_obj.isShowMoreBlock 是否显示更多模块
      @params {boolean} status_obj.loadMore 是否显示加载更多
      @params {boolean} status_obj.noData 是否显示没有数据
    */
    setStatusData(status_obj) {
      let statusObj = {
        isShowMoreBlock: true,
        loadMore: true,
        noData: false
      }
      Object.assign(statusObj, status_obj)
      this.setData(statusObj)
    },
    /*
      @func setListStatus
      @desc 设置搜索结果列表显示状态
      @params {string} status 状态 
    */
    setListStatus(status) {
      switch (status) {
        case 'loadmore': //加载更多
          this.setStatusData()
          break
        case 'nomore': //没有更多
          this.setStatusData({
            loadMore: false
          })
          break
        default: //无数据
          this.setStatusData({
            isShowMoreBlock: false,
            loadMore: false,
            noData: true
          })
          break
      }
    },
    /*
      @func onLoadMore
      @desc 加载更多
    */
    onLoadMore() {
      if (!this.data.loadMore) { // 判断是否还有更多数据可以加载
        return
      }
      this.triggerEvent("loadmore")
    }
  }
})