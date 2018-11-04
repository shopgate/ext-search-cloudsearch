const Invoker = require('../../../cloudsearch/Invoker')
const assert = require('assert')
const sinon = require('sinon')

describe('cloudsearch/Invoker', function () {
  let queryBuilder
  let requester
  /**
   * @var {Invoker}
   */
  let invoker

  beforeEach(() => {
    queryBuilder = {
      searchTerm: 'term',
      buildSearchQuery: (fuzzy, forFilters) => {
        let out = 'term'
        if (fuzzy) out += '~2'
        if (forFilters) out = `p${out}`
        return out
      },
      shopLanguage: 'de-de'
    }

    requester = {}
    invoker = new Invoker(requester, { info: () => null })
  })

  describe('search()', () => {
    it('should search and respond', async () => {
      const response = { hits: { found: 10, hit: [{ fields: { uid: '123' } }] } }
      requester.request = async (query, lang) => {
        assert.equal(query, 'term')
        assert.equal(lang, 'de-de')
        return response
      }
      const res = await invoker.search(queryBuilder)
      const expectedResponse = {
        productIds: ['123'],
        totalProductCount: 10
      }
      assert.deepStrictEqual(res, expectedResponse)
    })

    it('should use the fuzzy search if a direct match had no hits', async () => {
      requester.request = sinon.stub()
      requester.request.onCall(0).resolves(null)
      const response = { hits: { found: 1, hit: [{ fields: { uid: '123' } }] } }
      requester.request.onCall(1).resolves(response)

      const res = await invoker.search(queryBuilder)
      const expectedResponse = {
        productIds: ['123'],
        totalProductCount: 1
      }
      assert.equal(requester.request.callCount, 2)
      assert.deepStrictEqual(res, expectedResponse)
      assert.deepStrictEqual(requester.request.getCall(0).args, ['term', 'de-de'])
      assert.deepStrictEqual(requester.request.getCall(1).args, ['term~2', 'de-de'])
    })

    it('should return an empty array and zero if nothing was found', async () => {
      requester.request = sinon.stub()
      requester.request.onCall(0).resolves(null)
      const response = {}
      requester.request.onCall(1).resolves(response)

      const res = await invoker.search(queryBuilder)
      const expectedResponse = {
        productIds: [],
        totalProductCount: 0
      }
      assert.equal(requester.request.callCount, 2)
      assert.deepStrictEqual(res, expectedResponse)
      assert.deepStrictEqual(requester.request.getCall(0).args, ['term', 'de-de'])
      assert.deepStrictEqual(requester.request.getCall(1).args, ['term~2', 'de-de'])
    })
  })

  describe('getFilters()', () => {
    it('should get the filters', async () => {
      const response = { hits: { found: 1, hit: [{ fields: { uid: '123' } }] } }
      requester.request = async (query, lang) => {
        assert.equal(query, 'pterm')
        assert.equal(lang, 'de-de')
        return response
      }
      invoker.responseParser.getFilterResponse = sinon.stub()
      invoker.responseParser.getFilterResponse.resolves({ foo: 'test' })

      const res = await invoker.getFilters(queryBuilder)
      assert.deepStrictEqual(res, { foo: 'test' })
      assert.deepStrictEqual(
        invoker.responseParser.getFilterResponse.getCall(0).args,
        [response, 'de-de']
      )
    })

    it('should use the fuzzy search if a direct match had no hits', async () => {
      requester.request = sinon.stub()
      requester.request.onCall(0).resolves(null)
      const response = { hits: { found: 1, hit: [{ fields: { uid: '123' } }] } }
      requester.request.onCall(1).resolves(response)

      invoker.responseParser.getFilterResponse = sinon.stub()
      invoker.responseParser.getFilterResponse.resolves({ foo: 'test' })

      const res = await invoker.getFilters(queryBuilder)

      assert.equal(requester.request.callCount, 2)
      assert.deepStrictEqual(res, { foo: 'test' })
      assert.deepStrictEqual(requester.request.getCall(0).args, ['pterm', 'de-de'])
      assert.deepStrictEqual(requester.request.getCall(1).args, ['pterm~2', 'de-de'])
    })
  })
})
