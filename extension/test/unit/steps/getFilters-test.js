const proxyquire = require('proxyquire')
const sinon = require('sinon')
const assert = require('assert')

describe('steps/getFilters', () => {
  let getFilters
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
    getFilters = proxyquire('../../../steps/getFilters.js', {
      '../cloudsearch/QueryBuilder': MockQueryBuilder,
      '../cloudsearch/Requester': MockRequester,
      '../cloudsearch/Invoker': MockInvoker,
      '../Helper': Helper
    })
    MockQueryBuilder.prototype.setSearchTerm = sinon.stub()
    MockQueryBuilder.prototype.addCategoryFilter = sinon.stub()
    MockInvoker.prototype.getFilters = sinon.stub().resolves({ foo: 'bar' })
  })

  it('should get filters for a category', async () => {
    const context = {
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        shopNumber: 'shop_30685',
        languageId: 'de'
      },
      log: null
    }

    const result = await getFilters(context, { categoryPath: 'Men=>' })
    assert.deepStrictEqual(result, { filters: { foo: 'bar' } })
    assert.strictEqual(MockInvoker.prototype.getFilters.callCount, 1)
    assert.deepStrictEqual(
      MockQueryBuilder.prototype.addCategoryFilter.getCall(0).args,
      ['Men=>']
    )
    assert.deepStrictEqual(
      mockQueryBuilderConstructorArgs,
      [context.config]
    )
    assert.deepStrictEqual(
      mockRequesterConstructorArgs,
      [context.config.cloudsearchUrls]
    )
  })

  it('should get filters for a search phrase', async () => {
    const context = {
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        shopNumber: 'shop_30685',
        languageId: 'de'
      },
      log: null
    }

    const result = await getFilters(context, { searchPhrase: 'Men' })
    assert.deepStrictEqual(result, { filters: { foo: 'bar' } })
    assert.strictEqual(MockInvoker.prototype.getFilters.callCount, 1)
    assert.deepStrictEqual(
      MockQueryBuilder.prototype.setSearchTerm.getCall(0).args,
      ['Men']
    )
    assert.deepStrictEqual(
      mockQueryBuilderConstructorArgs,
      [context.config]
    )
    assert.deepStrictEqual(
      mockRequesterConstructorArgs,
      [context.config.cloudsearchUrls]
    )
  })

  it('should throw an error if input param is set', async () => {
    const context = {
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        shopNumber: 'shop_30685',
        languageId: 'de'
      },
      log: null
    }
    try {
      await getFilters(context, {})
      assert.fail()
    } catch (err) {
      assert.ok(err)
      assert.strictEqual(err.code, 'EVALIDATION')
      assert.strictEqual(err.message, 'searchPhrase, filters or categoryId has to be set')
    }
  })
})
