
const uploader = require("../../utils/util.js");

const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    school: '',
    praiseBorder: '',
    notPraiseBorder: '',
    posts: [],
    baseImageUrl: app.globalData.imageUrl,
    show: 0,
    hidden: false,
    showCommentInput: false,
    showCommentInput: false,
    commentContent: '',
    commentObjId: '',
    commentType: '',
    refcommentId: '',
    pageSize: 10,
    pageNumber: 1,
    initPageNumber: 1,
    showGeMoreLoadin: false,
    currentTime: '',
    notDataTips:false
  },

  onLoad: function () {

    console.log('工具类' + uploader.formatTime(new Date()));
    //设置当前时间
    this.setData({
      currentTime: uploader.formatTime(new Date())
    });

    let _this = this;

    let token = wx.getStorageSync('token');
    console.log('获取到token:' + token);

    this.getSchool(_this);

    //获取缓存的贴子列表
    let posts = wx.getStorageSync('posts');
    if (posts) {
      this.setData({
        posts: posts
      });
    }

    this.getNewPost();

  },
  onShow: function () {
    console.log('on show');

    let _this = this;
    this.getSchool(_this);

    //this.getNewPost();
    this.getMostNewPost();

  },

  /**
   * 下拉刷新，获取最新的贴子
   */
  onPullDownRefresh: function () {

    console.log('当前时间：'+this.data.currentTime);

      this.getMostNewPost();
  },

  /**
   * 上拉加载跟多
   */
  onReachBottom: function () {

    console.log('到底了');

    let _this = this;

    this.setData({
      showGeMoreLoadin: true
    });

    this.getPost(_this);

  },

  /**
   * 事件处理函数
   */
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  /** 进入发表页面 */
  post: function () {
    console.log('Post');

    wx.navigateTo({
      url: '/pages/post/post'
    })
  },
  selectSchool: function () {
    console.log('select school');

    wx.navigateTo({
      url: '/pages/school/school'
    })
  },

  /** 获取学校 */
  getSchool: function (_this) {
    console.log('get school');

    app.http('GET', '/school', {}, function (res) {

      console.log(res.data);

      _this.setData({
        school: res.data.data
      });

    });
  },

  /** 获取最新的贴子 */
  getMostNewPost: function () {

    //获取新的贴子
    app.http('get', '/most_new_post', {
      date_time: this.data.currentTime
    }, res => {

      this.setData({
        currentTime: uploader.formatTime(new Date())
      });

      wx.stopPullDownRefresh();

      console.log('返回的贴子数据');
      console.log(res.data.data);

      let posts = this.data.posts;

      if(res.data.data.length > 0){
        
        res.data.data.map(item=>{

          posts.unshift(item);

        });

        this.setData({
          posts:posts
        });

      }

    });

  },
  /** 发表贴子后获取最新的贴子 */
  getNewPost: function () {

    //获取新的贴子
    app.http('get', '/post', {
      page_size: 10,
      page_number: 1
    }, res => {

      console.log('返回的贴子数据');
      console.log(res.data.data.page_data);

      this.setData({
        posts: res.data.data.page_data,
        pageNumber: this.data.initPageNumber
      });

    });


  },

  /** 获取贴子 */
  getPost: function (_this) {

    console.log('function getPost');

    this.setData({
      notDataTips: false
    });

    app.http('get', '/post', {
      page_size: this.data.pageSize,
      page_number: this.data.pageNumber
    }, res => {

      this.setData({
        showGeMoreLoadin: false
      })

      let posts = this.data.posts;

      console.log('返回的贴子数据');
      console.log(res.data.data.page_data);
      console.log('第几页' + this.data.pageNumber);

      if (res.data.data.page_data.length > 0) {
        res.data.data.page_data.map(item => {
          posts.push(item);
        });

        this.setData({
          posts: posts,
          pageNumber: this.data.pageNumber + 1
        });
      }else{
        this.setData({
          notDataTips:true
        });
      }

    });

  },
  /** 预览图片 */
  previewImage: function (event) {

    console.log(event.target.id);

    let url = event.target.id;

    wx.previewImage({
      current: '',
      urls: [url]
    })
  },

  /** 显示评论控制面板 */
  showComment: function (event) {

    this.setData({
      show: 0
    });

    let id = event.target.id;
    let hidden = event.target.dataset.show;

    if (!hidden) {
      this.setData({
        show: id,
        hidden: true
      });
    } else {
      this.setData({
        show: 0,
        hidden: false
      });
    }

    console.log(hidden)
    console.log(event)
    console.log(id);

  },

  /** 触摸屏幕后移动触发一些隐藏操作 */
  hiddenComment: function () {
    console.log('inde-hiddenComment：触摸后移动');
    this.setData({
      show: 0,
      hidden: false,
      showCommentInput: false
    });
  },

  /** 点赞 */
  praise: function (event) {
    console.log('index-praise：点赞');

    let objId = event.target.dataset.obj;
    let objType = 1;
    console.log(objId);

    this.setData({
      show: 0,
      hidden: false,
      showCommentInput: false
    });

    let _this = this;

    app.http('post', `/praise`, { obj_id: objId, obj_type: objType }, res => {
      console.log('点赞成功' + res);

      let postList = _this.data.posts;
      let newPostList = postList.map(item => {

        if (objId == item.id) {
          item.praises.push(res.data.data);
        }

        return item;
      });

      //重新赋值，更新数据列表
      _this.setData({
        posts: newPostList
      });

    });

  },

  /** 激活评论框 */
  showCommentInput: function (event) {
    console.log('index-showCommentInput：激活评论框');

    let objId = event.target.dataset.objid;
    let type = event.target.dataset.objtype;
    console.log('评论对象Id:' + objId)
    console.log('评论类型:' + type)

    this.setData({
      commentObjId: objId,
      commentType: type,
      show: 0,
      hidden: false,
      showCommentInput: true
    });
  },

  /** 获取评论框的输入内容 */
  getCommentContent: function (event) {
    console.log("评论框输入内容:" + event.detail.value);

    let content = event.detail.value;
    this.setData({
      commentContent: content
    })
  },

  /** 提交评论 */
  sendComment: function (e) {

    let _this = this;

    let content = this.data.commentContent;
    let objId = this.data.commentObjId;
    let type = this.data.commentType;
    let refcommentId = this.data.refcommentId;

    if (content == '') {
      return;
    }

    console.log('objid:' + objId);
    console.log('refcommentid:' + refcommentId);
    console.log('评论的内容:' + content);
    console.log('评论的Id:' + objId);
    console.log('评论的类型:' + type);

    app.http('post', '/comment', {
      content: content,
      obj_id: objId,
      type: type,
      ref_comment_id: refcommentId
    }, function (res) {

      _this.setData({
        commentContent: '',
        commentObjId: '',
        commentType: '',
        showCommentInput: false,
        refcommentId: ''
      })

      console.log('返回的评论内容');
      console.log(res);

      let postList = _this.data.posts;
      let newPostList = postList.map(item => {

        if (objId == item.id) {
          item.comments.push(res.data.data);
        }

        return item;
      });

      //重新赋值，更新数据列表
      _this.setData({
        posts: newPostList
      });


    });

  },

  /** 回复别人 */
  commentOtherComment: function (e) {

    console.log(e.currentTarget.dataset);
    let objId = e.currentTarget.dataset.objid;
    let type = e.currentTarget.dataset.objtype;
    let refcommentId = e.currentTarget.dataset.refid;

    console.log('评论对象Id:' + objId)
    console.log('评论类型:' + type)

    this.setData({
      commentObjId: objId,
      commentType: type,
      show: 0,
      hidden: false,
      showCommentInput: true,
      refcommentId: refcommentId
    });
  },

  /** 删除评论 */
  deleteComment: function (e) {
    console.log('删除评论')

    let objId = e.currentTarget.dataset.objid;
    let commentId = e.currentTarget.dataset.refid;
    let _this = this;

    console.log('评论Id：' + commentId);
    console.log('帖子Id' + objId);

    wx.showModal({
      title: '提示',
      content: '确认删除该评论?',
      success: function (res) {
        if (res.confirm) {

          console.log('用户点击确定')

          app.http('delete', `/delete/${commentId}/comment`, {}, res => {

            if (res.data.data == 1) {

              let newPostList = _this.data.posts.map(item => {

                if (objId == item.id) {

                  let newComment = item.comments.filter((item, index) => {

                    if (item.id != commentId) {
                      return item;
                    }

                  });

                  item.comments = newComment;

                }

                return item;
              });

              _this.setData({
                posts: newPostList
              });
            }

          });


        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },


  /** 删除帖子 */
  deletePost: function (e) {

    let objId = e.target.id;
    let _this = this;

    console.log('删除贴子的id:' + objId);

    wx.showModal({
      title: '提示',
      content: '确定删除吗?',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');

          app.http('delete', `/delete/${objId}/post`, {}, res => {

            console.log(res.data);
            let result = res.data.data;

            if (result == 1) {
              console.log('删除成功');

              let newPosts = _this.data.posts.filter((item, index) => {
                if (item.id != objId) {

                  return item;

                }
              });

              _this.setData({
                posts: newPosts
              });

            } else {
              console.log('删除失败');
            }

          });

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  /** 取消赞 */
  deletePraise: function (e) {

  },

  /** 关注 */
  follow: function (e) {

  },

  /** 取消关注 */
  cancelFollow: function (e) {

  }


})