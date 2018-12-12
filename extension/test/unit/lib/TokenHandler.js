const assert = require('assert')
const nock = require('nock')
const sinon = require('sinon')
const TokenHandler = require('../../../lib/TokenHandler')
const ProxyError = require('../../../lib/ProxyError')

describe('lib/TokenHandler', () => {
  before(() => nock.disableNetConnect())
  after(() => nock.enableNetConnect())

  afterEach(() => {
    sinon.reset()
    nock.cleanAll()
  })

  it('should instantiate', async () => {
    const credentials = {}
    const tokenHandler = new TokenHandler(credentials)

    assert(tokenHandler instanceof TokenHandler)
    assert.deepStrictEqual(tokenHandler.credentials, credentials)
  })

  it('should return the cached token', async () => {
    const cachedToken = { expires: Date.now() + 1e5 }
    const tokenHandler = new TokenHandler({})
    tokenHandler.token = cachedToken

    const token = await tokenHandler.getToken()

    assert.deepStrictEqual(token, cachedToken)
  })

  it('should retrieve a new token', async () => {
    const expectedToken = {
      access_token: 'access_token',
      refresh_token: 'refresh_token',
      expires_in: 60
    }
    const auth = nock('https://auth.test.tld/')
      .post('/oauth/token')
      .reply(200, expectedToken)

    const credentials = {
      api: 'https://{serviceName}.test.tld',
      clientId: 'clientId',
      clientSecret: 'clientSecret'
    }
    const tokenHandler = new TokenHandler(credentials)
    tokenHandler.token = { expires: 0 }

    const token = await tokenHandler.getToken()

    assert.strictEqual(token.token, expectedToken.access_token)
    assert.strictEqual(token.refreshToken, expectedToken.refresh_token)
    assert.strictEqual(token.api, credentials.api)
    assert(token.expires <= expectedToken.expires_in * 1000 + Date.now())
    auth.done()
  })

  it('should fail on auth error', async () => {
    const auth = nock('https://auth.test.tld/')
      .post('/oauth/token')
      .reply(400, {})

    const credentials = {
      api: 'https://{serviceName}.test.tld',
      clientId: 'clientId',
      clientSecret: 'clientSecret'
    }
    const tokenHandler = new TokenHandler(credentials)
    tokenHandler.token = { expires: 0 }

    await assert.rejects(async () => {
      await tokenHandler.getToken()
      auth.done()
    }, err => err instanceof ProxyError)
  })
})
