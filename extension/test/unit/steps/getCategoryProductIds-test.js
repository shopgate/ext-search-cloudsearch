const assert = require('assert')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('steps/getCategoryProductIds', async () => {
  const tokenHandlerMock = {}
  const TokenHandlerMock = sinon.stub().returns(tokenHandlerMock)

  const RequestMock = sinon.stub()

  const invokerMock = { search: sinon.stub() }
  const InvokerMock = sinon.stub()
  InvokerMock.returns(invokerMock)

  const QueryBuilderMock = sinon.stub()
  const RequesterMock = sinon.stub()
  const HelperMock = {
    mapFiltersToQueryBuiler: sinon.stub()
  }
  const getCategoryProductIds = proxyquire('../../../steps/getCategoryProductIds.js', {
    'request-promise-native': RequestMock,
    '../lib/TokenHandler': TokenHandlerMock,
    '../cloudsearch/QueryBuilder': QueryBuilderMock,
    '../cloudsearch/Requester': RequesterMock,
    '../cloudsearch/Invoker': InvokerMock,
    '../Helper': HelperMock
  })

  afterEach(async () => {
    delete tokenHandlerMock.credentials
    delete tokenHandlerMock.getToken
    delete tokenHandlerMock.retrieveToken
    sinon.reset()
  })

  it('should get product IDs for category', async () => {
    const expectedResult = { productIds: ['1', '2'], totalProductCount: 2 }
    const context = {
      meta: { appId: 'shop_30685' },
      config: {
        categoryUseCloudsearch: true,
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

    tokenHandlerMock.credentials = {
      api: `https://{serviceName}.${context.config.credentials.baseDomain}`
    }
    tokenHandlerMock.getToken = sinon.stub().resolves({})
    const categoryMock = { path: 'Men' }

    RequestMock.resolves({ body: categoryMock })
    invokerMock.search.resolves(expectedResult)

    const queryBuilderMock = {
      addCategoryFilter: sinon.stub(),
      setSort: sinon.stub(),
      setPagination: sinon.stub()
    }
    HelperMock.mapFiltersToQueryBuiler.returns(queryBuilderMock)

    const result = await getCategoryProductIds(context, { categoryId: 'men', sort: 'priceAsc' })

    sinon.assert.calledWithNew(TokenHandlerMock)
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
        categoryUseCloudsearch: false,
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

    sinon.assert.notCalled(TokenHandlerMock)
    sinon.assert.notCalled(RequestMock)
    assert.deepStrictEqual(result, expectedResult)
  })
})
