const proxyquire = require('proxyquire')
const sinon = require('sinon')
const assert = require('assert')

describe('steps/search', () => {
  let search
  let MockRequester
  let MockInvoker
  let MockQueryBuilder
  let Helper
  let mockQueryBuilderConstructorArgs
  let mockRequesterConstructorArgs

  beforeEach(() => {
    MockRequester = class { constructor (...args) { mockRequesterConstructorArgs = args } }
    MockInvoker = class {
      constructor (requester, log) { this.requester = requester; this.log = log }
    }
    MockQueryBuilder = class {
      constructor (...args) { mockQueryBuilderConstructorArgs = args }
    }
    Helper = { mapFiltersToQueryBuilder: (filters, queryBuilder) => queryBuilder }
    search = proxyquire('../../../steps/search.js', {
      '../cloudsearch/QueryBuilder': MockQueryBuilder,
      '../cloudsearch/Requester': MockRequester,
      '../cloudsearch/Invoker': MockInvoker,
      '../Helper': Helper
    })
    MockQueryBuilder.prototype.setSearchTerm = sinon.stub()
    MockQueryBuilder.prototype.setSort = sinon.stub()
    MockQueryBuilder.prototype.setPagination = sinon.stub()
    MockInvoker.prototype.search = sinon.stub().resolves({ foo: 'bar' })
  })

  it('should search', async () => {
    const context = {
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        shopNumber: 'shop_30685',
        languageId: 'de'
      },
      log: null
    }

    const result = await search(context, { searchPhrase: 'Men', sort: 'priceAsc' })
    assert.deepStrictEqual(result, { foo: 'bar' })
    assert.deepStrictEqual(MockQueryBuilder.prototype.setSearchTerm.getCall(0).args, ['Men'])
    assert.deepStrictEqual(MockQueryBuilder.prototype.setSort.getCall(0).args, ['priceAsc'])
    assert.deepStrictEqual(MockQueryBuilder.prototype.setPagination.getCall(0).args, [0, 20])
    assert.equal(MockInvoker.prototype.search.callCount, 1)

    assert.deepStrictEqual(
      mockQueryBuilderConstructorArgs,
      [context.config.shopNumber, context.config.languageId]
    )
    assert.deepStrictEqual(
      mockRequesterConstructorArgs,
      [context.config.cloudsearchUrls]
    )
  })

  it('should search with default sort and different offset and limit', async () => {
    const context = {
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        shopNumber: 'shop_30685',
        languageId: 'de'
      },
      log: null
    }

    const result = await search(context, { offset: 10, limit: 30, searchPhrase: 'Men' })
    assert.deepStrictEqual(result, { foo: 'bar' })
    assert.deepStrictEqual(MockQueryBuilder.prototype.setSearchTerm.getCall(0).args, ['Men'])
    assert.deepStrictEqual(MockQueryBuilder.prototype.setSort.getCall(0).args, ['relevance'])
    assert.deepStrictEqual(MockQueryBuilder.prototype.setPagination.getCall(0).args, [10, 30])
    assert.equal(MockInvoker.prototype.search.callCount, 1)

    assert.deepStrictEqual(
      mockQueryBuilderConstructorArgs,
      [context.config.shopNumber, context.config.languageId]
    )
    assert.deepStrictEqual(
      mockRequesterConstructorArgs,
      [context.config.cloudsearchUrls]
    )
  })

  it('should throw an error if limit is higher then 100', async () => {
    const context = {
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        shopNumber: 'shop_30685',
        languageId: 'de'
      },
      log: null
    }
    try {
      await search(context, { limit: 200 })
      assert.fail()
    } catch (err) {
      assert.ok(err)
      assert.equal(err.code, 'EVALIDATION')
      assert.equal(err.message, 'The limit can\'t be greater than 100')
    }
  })
})
