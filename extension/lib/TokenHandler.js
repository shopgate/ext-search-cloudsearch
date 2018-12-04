const { URL } = require('url')
const request = require('request-promise-native')
const ProxyError = require('./ProxyError')

const MINIMUM_VALID_TIME = 60000

/**
 * Class to handle token retrievement and update
 */
class TokenHandler {
  /**
   * Construct a new instance of TokenHandler
   *
   * @param {Object} options
   * @param {String} options.api
   * @param {String} options.clientId
   * @param {String} options.clientSecret
   * @param {String} options.refreshToken
   */
  constructor (options) {
    this.credentials = options
    this.refreshToken = options.refreshToken
    this.token = null
  }

  /**
   * Get a token
   * @returns {Promise<Object>}
   */
  async getToken () {
    if (!this.token || (this.token.expires - MINIMUM_VALID_TIME) < Date.now()) {
      await this.retrieveNewToken()
    }

    return this.token
  }

  /**
   * Retrieve a new token
   * @returns {Promise<Object>}
   */
  async retrieveNewToken () {
    const url = new URL(this.credentials.api.replace('{serviceName}', 'auth'))
    url.pathname = '/oauth/token'

    const auth = Buffer.from(`${this.credentials.clientId}:${this.credentials.clientSecret}`)
    const requestOptions = {
      resolveWithFullResponse: true,
      simple: false,
      json: true,
      form: {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      },
      headers: {
        Authorization: `Basic ${auth.toString('base64')}`,
        Host: url.host
      }
    }

    const { statusCode, body } = await request.post(url.href, requestOptions)

    if (statusCode !== 200) {
      throw new ProxyError(statusCode, body, {
        service: 'auth',
        path: '/oauth/token',
        method: 'POST'
      })
    }

    if (body.refresh_token !== this.refreshToken) {
      this.refreshToken = body.refresh_token
    }

    this.token = {
      token: body.access_token,
      refreshToken: body.refresh_token,
      expires: Date.now() + body.expires_in * 1000,
      api: this.credentials.api
    }

    return this.token
  }
}

module.exports = TokenHandler
