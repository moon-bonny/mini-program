Component({
  data: {
    isShowMoreBlock: false, //是否显示加载更多模块
    loadMore: true, //是否加载更多 true-加载更多
    noData: false //没有数据
  },
  methods: {
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
        case 'none': //隐藏加载状态
          this.setData({
            isShowMoreBlock: false,
            loadMore: false
          })
          break
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
    },
    /*
      @func onScrollUpper
      @desc 滚到列表顶部
    */
    onScrollUpper() {
      this.triggerEvent("scrollupper")
    }
  }
})