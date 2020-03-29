Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    properties: {
      commentData: { // 列表数据
        type: Object,
        value: []
      },
      isShowAllComments: { //是否展开所有评论
        type: Boolean,
        value: false
      },
      allCommentUrl: {
        type:String,
        value: ''
      }
    },
    data: {
      starNum: 5,
      isShowAllComment: [], //是否显示展开评论按钮
      isShowAllCommentBtn: [] //是否展开评论内容
    },
    methods: {
      /*
        @func onToggleAllComment
        @desc 展开or收起评论
        @params {obj} e 事件对象
      */
      onToggleAllComment(e) {
        let target = e.target,
            index = target.dataset.index,
            type = target.dataset.type

        if(index === 'undefined' || type !== 'commentShowBtn') {
          return
        }
        let isShowAllComment = this.data.isShowAllComment
        isShowAllComment[index] = !isShowAllComment[index]

        this.setData({
          isShowAllComment: isShowAllComment
        })
      },
      /*
        @func renderAllCommentBtn
        @desc 通过评论内容高度判断是否要添加展开收起按钮
        @params {obj} wrapperQuery 评论wrapper节点信息的对象
        @params {int} [commentLength] 可选, 之前渲染过的评论长度
      */
      renderAllCommentBtn(wrapperQuery, commentLength) {
        wrapperQuery.exec((wrapperRes) => {
          // 计算评论收起展示的最大高度(最多4行)
          let lineHeight = wrapperRes[0].width / 750 * 48,
              maxHeight = lineHeight * 4 - 5
          let isShowAllCommentBtn = this.data.isShowAllCommentBtn

          let query = this.createSelectorQuery()
          query.selectAll('.comment-txt').boundingClientRect()
          query.exec((res) => {
            res[0].forEach((rect) => {
              let index = rect.dataset.index
              // 之前渲染过的评论跳过
              if(commentLength && index < commentLength){
                return
              }
              // 评论高度大于4行高度时显示展开收起按钮
              if(rect.height > maxHeight) {
                isShowAllCommentBtn[index] = true
              }

              // 渲染评论列表展开按钮
              if(index === this.properties.commentData.list.length - 1){
                // this.properties.isShowAllCommentBtn = isShowAllCommentBtn
                this.setData({
                  isShowAllCommentBtn: isShowAllCommentBtn
                })
              }
            })
          })
        })
      }
    }
})