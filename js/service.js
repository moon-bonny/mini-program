import PromiseLib from 'lib/polyfill'
import Util from 'util'
Promise = typeof Promise == 'undefined' ? PromiseLib : Promise
let Toast = Util.Toast
/*
  @func promisify
  @desc 微信api promise封装
  @params {string} api 微信api
  @params {obj} [options] 微信api选项
  @params {obj} [params] 参数
*/
function promisify(api, options = {}, params = {}) {
  return (() => {
    return new Promise((resolve, reject) => {
        api(Object.assign({}, options, { success: resolve, fail: reject }), ...params)
    })
  })()
}
/*
  @func request
  @desc 请求接口封装为promise
  @params {string} config 配置参数
  @params {string} config.method 请求方式
  @params {string} config.data 请求参数
  @params {obj} [config.header] 请求头
  @params {obj} url 请求地址
  @params {obj} options 请求配置选项
  @params {boolean} options.isShowLoader 是否显示loading提示
  @params {int} options.version 接口版本,默认为1
*/
function request(config, url, options) {
  //返回一个promise实例
  return new Promise((resolve, reject) => {
    options.isShowLoader && wx.showLoading({
      title: '加载中...'
    })

    let version = options.version || 1 
    let baseUrl = 'https://sczd-test.tuandai.com/v' + version //test
    // let baseUrl = 'https://sczd.tuandai.com/v' + version //pro

    let networkType = ''
    wx.request(Object.assign({
      url: baseUrl + url,
      success: (res) => {
        if (!res) {
          return
        }
        resolve(res)
      },
      fail: (res) => {
        // 获取网络类型, 有效值：wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
        wx.getNetworkType({
          success: (res) => {
            networkType = res.networkType//网络状态
          },
          complete: () => {
            if(networkType === 'none'){
              Toast('网络不太给力，请检查后再试')
              return
            }

            // 请求失败toast
            try {
              Toast(res.errMsg || '请求失败，请稍后重试')
            } catch (e) {
              Toast('请求失败，请稍后重试')
            }
            reject(res)
          }
        })
      },
      complete: () => {
        (networkType !== 'none') && wx.hideLoading()
        let complete = config.data.complete
        typeof complete === "function" && complete.call(this)
      }
    }, config))
  })
}

export default {
  getData(url, data = {}, options = {}) {
    let config = {
          method: 'GET',
          data: data
        },
        _options = {
          isShowLoader: true
        }
    Object.assign(_options, options)
    return request(config, url, _options)
  },
  postData(url, data = {}, options = {}) {
    let config = {
          method: 'POST',
          data: data,
          header: { // 设置contentType
            'content-type': 'application/x-www-form-urlencoded',
            'csrftoken': Util.getCsrfToken(parseInt(+new Date() / 1000))
          }
        },
        _options = {
          isShowLoader: true
        }
    Object.assign(_options, options)
    return request(config, url, _options)
  },
  wxLogin() {
    return promisify(wx.login)
  }
}