const Requester = require('../../../cloudsearch/Requester')
const assert = require('assert')
const nock = require('nock')

describe('cloudsearch/Requester', function () {
  let requester
  const apiUrls = {
    de: 'http://endpoint.de/',
    en: 'http://endpoint.en/'
  }

  before(() => nock.disableNetConnect())
  after(() => nock.enableNetConnect())

  beforeEach(() => {
    requester = new Requester(apiUrls)
  })

  it('should request', async () => {
    const queryParams = {
      'q.parser': 'structured',
      q: 'matchall',
      start: 10,
      'facet.attributes': { sort: 'bucket', size: 5000 }
    }
    const expected = {
      'q.parser': 'structured',
      q: 'matchall',
      start: 10,
      'facet.attributes': '{"sort":"bucket","size":5000}'
    }
    const api = nock('http://endpoint.de/')
      .get('/')
      .query(expected)
      .reply(200, { a: 1, b: 2 })

    const result = await requester.request(queryParams, 'de-de')
    assert.deepStrictEqual(result, { a: 1, b: 2 })
    api.done()
  })

  it('should fail if the statusCode is != 200', async () => {
    const api = nock('http://endpoint.de/')
      .get('/')
      .reply(400, { message: 'foo' })

    try {
      await requester.request({}, 'de-de')
    } catch (err) {
      assert.ok(err)
      assert.deepStrictEqual(err.error, { message: 'foo' })
      api.done()
    }
  })

  it('should fail if the statusCode is != 200 and no message is there', async () => {
    const api = nock('http://endpoint.de/')
      .get('/')
      .reply(400, { foo: 'bar' })

    try {
      await requester.request({}, 'de-de')
    } catch (err) {
      assert.ok(err)
      assert.strictEqual(err.statusCode, 400)
      assert.deepStrictEqual(err.error, { 'foo': 'bar' })
      api.done()
    }
  })

  it('should should use the english endpoint for unknown languages', async () => {
    const api = nock('http://endpoint.en/')
      .get('/')
      .reply(400)

    try {
      await requester.request({}, 'fu')
    } catch (err) {
      assert.ok(err)
      assert.strictEqual(err.statusCode, 400)
      api.done()
    }
  })
})
