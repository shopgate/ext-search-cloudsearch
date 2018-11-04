const request = require('request-promise-native')

class Requester {
  /**
   * @param {Object} apiUrls
   * @param {String} apiUrls.en
   * @param {String} apiUrls.de
   */
  constructor (apiUrls) {
    this.apiUrls = apiUrls
  }

  async request (queryParams, shopLanguage) {
    const options = {
      uri: this.getUrl(shopLanguage),
      qs: this._stringifyArrayParams(queryParams),
      timeout: 10000,
      json: true
    }

    return request(options)
  }

  _stringifyArrayParams (queryParams) {
    for (const key in queryParams) {
      if (typeof queryParams[key] === 'object') {
        queryParams[key] = JSON.stringify(queryParams[key])
      }
    }
    return queryParams
  }

  getUrl (shopLanguage) {
    const shopLangShort = shopLanguage.substring(0, 2)
    return this.apiUrls[shopLangShort === 'de' ? shopLangShort : 'en']
  }
}

module.exports = Requester
