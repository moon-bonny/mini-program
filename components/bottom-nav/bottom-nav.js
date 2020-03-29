Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    properties: {
      isFavorited: { // 是否收藏
        type: Number,
        value: 0
      }
    },
    methods: {
      /*
        @func onToggleCollect
        @desc 取消or收藏
      */
      onToggleCollect() {
        this.triggerEvent("togglecollect")
      },
      /*
        @func onComment
        @desc 点评
      */
      onComment() {
        this.triggerEvent("comment")
      },
      /*
        @func onShare
        @desc 分享
      */
      onShare() {
        this.triggerEvent("share")
      }
    }
})