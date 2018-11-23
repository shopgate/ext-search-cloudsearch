const assert = require('assert')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('steps/getCategoryProductIds', async () => {
  const tokenHandlerMock = {}
  const externalBigAPIMock = { request: sinon.stub() }
  const BigApiRequesterMock = {
    TokenHandler: sinon.stub(),
    ExternalBigAPI: sinon.stub()
  }

  const invokerMock = { search: sinon.stub() }
  const InvokerMock = sinon.stub()
  InvokerMock.returns(invokerMock)

  const QueryBuilderMock = sinon.stub()
  const RequesterMock = sinon.stub()
  const HelperMock = {
    mapFiltersToQueryBuiler: sinon.stub()
  }
  const getCategoryProductIds = proxyquire('../../../steps/getCategoryProductIds.js', {
    '@shopgate/bigapi-requester': BigApiRequesterMock,
    '../cloudsearch/QueryBuilder': QueryBuilderMock,
    '../cloudsearch/Requester': RequesterMock,
    '../cloudsearch/Invoker': InvokerMock,
    '../Helper': HelperMock
  })

  BigApiRequesterMock.TokenHandler.returns(tokenHandlerMock)
  BigApiRequesterMock.ExternalBigAPI.returns(externalBigAPIMock)

  afterEach(async () => {
    sinon.reset()
  })

  it('should get product IDs for category', async () => {
    const expectedResult = { productIds: ['1', '2'], totalProductCount: 2 }
    const context = {
      meta: { appId: 'shop_30685' },
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        credentials: {
          baseDomain: 'shopgatedev.services',
          clientId: 'clientId',
          clientSecret: 'clientSecret',
          refreshToken: 'refreshToken'
        }
      },
      log: null
    }

    const categoryMock = { path: 'Men' }

    externalBigAPIMock.request.withArgs({
      service: 'product',
      version: 'v1',
      path: '30685/categories/men',
      method: 'GET'
    }).resolves({ body: categoryMock })

    invokerMock.search.resolves(expectedResult)

    const queryBuilderMock = {
      addCategoryFilter: sinon.stub(),
      setSort: sinon.stub(),
      setPagination: sinon.stub()
    }
    HelperMock.mapFiltersToQueryBuiler.returns(queryBuilderMock)

    const result = await getCategoryProductIds(context, { categoryId: 'men', sort: 'priceAsc' })

    sinon.assert.calledWithNew(BigApiRequesterMock.TokenHandler)
    sinon.assert.calledWithNew(BigApiRequesterMock.ExternalBigAPI)
    sinon.assert.calledWithNew(InvokerMock)
    sinon.assert.calledWithNew(QueryBuilderMock)
    sinon.assert.calledOnce(HelperMock.mapFiltersToQueryBuiler)
    sinon.assert.calledOnce(queryBuilderMock.addCategoryFilter)
    sinon.assert.calledOnce(queryBuilderMock.setSort)
    sinon.assert.calledOnce(queryBuilderMock.setPagination)

    assert.deepStrictEqual(result.productIds, expectedResult.productIds)
    assert.strictEqual(result.totalProductCount, expectedResult.totalProductCount)
  })

  it('should not resolve categoryPath if sorting is not priceAsc or priceDesc', async () => {
    const expectedResult = {}
    const context = {
      meta: { appId: 'shop_30685' },
      config: {
        cloudsearchUrls: { de: 'https://cloudsearch.de' },
        credentials: {
          baseDomain: 'shopgatedev.services',
          clientId: 'clientId',
          clientSecret: 'clientSecret',
          refreshToken: 'refreshToken'
        }
      },
      log: null
    }
    const result = await getCategoryProductIds(context, { categoryId: 'men' })

    sinon.assert.notCalled(BigApiRequesterMock.TokenHandler)
    sinon.assert.notCalled(BigApiRequesterMock.ExternalBigAPI)

    assert.deepStrictEqual(result, expectedResult)
  })
})
