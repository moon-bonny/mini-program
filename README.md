# 原生微信小程序
对小程序request，canvas等API二次封装，并制定弹窗等公共组件，方便项目重用。

## 快速开始
直接导入微信开发者工具即可使用。

## 项目结构
```sh
├─app.js                            小程序入口文件
├─app.json                          小程序全局配置和页面配置
├─app.wxss                          全局样式类，包括样式重置和可复用的样式
├─project.config.json               
├─README.md
├─template                          可复用的模板
|    ├─listModule
|    |     ├─listModule.wxml
|    |     └listModule.wxss
|    ├─listLoad
|    |    ├─listLoad.wxml
|    |    └listLoad.wxss
|    ├─classify
|    |    ├─classify.wxml
|    |    └classify.wxss
├─page                              小程序页面
|  ├─login
|  |   ├─login.js
|  |   ├─login.json
|  |   ├─login.wxml
|  |   └login.wxss
├─js                                js公共库，包括自定义和第三方
| ├─service.js                      小程序异步请求二次封装
| ├─util.js                         公共方法封装，如toast，canvas等公共方法
| ├─lib                             引用的第三方库
| |  ├─base64.js
| |  ├─crypto-js.js
| |  ├─fecha.js
| |  ├─polyfill.js
| |  └runtime.js
├─image
├─css                               公共css文件
|  └weui.wxss                       微信小程序默认样式
├─components                        可复用的组件
|     ├─search                      搜索组件
|     |   ├─search.js
|     |   ├─search.json
|     |   ├─search.wxml
|     |   └search.wxss
|     ├─listview                    列表组件
|     |    ├─listview.js
|     |    ├─listview.json
|     |    ├─listview.wxml
|     |    └listview.wxss
|     ├─dialog                      弹窗组件
|     |   ├─dialog.js
|     |   ├─dialog.json
|     |   ├─dialog.wxml
|     |   └dialog.wxss
|     ├─comment                     评论组件
|     |    ├─comment.js
|     |    ├─comment.json
|     |    ├─comment.wxml
|     |    └comment.wxss
|     ├─bottom-nav                  底部导航组件
|     |     ├─bottom-nav.js
|     |     ├─bottom-nav.json
|     |     ├─bottom-nav.wxml
|     |     └bottom-nav.wxss
|     ├─audio                       音频播放组件
|     |   ├─audio.js
|     |   ├─audio.json
|     |   ├─audio.wxml
|     |   └audio.wxss
```