const request = require('request-promise-native')
const TokenHandler = require('../lib/TokenHandler')
const ProxyError = require('../lib/ProxyError')
const QueryBuilder = require('../cloudsearch/QueryBuilder')
const Invoker = require('../cloudsearch/Invoker')
const Requester = require('../cloudsearch/Requester')
const Helper = require('../Helper')

async function getCategory (context, input) {
  const { config } = context
  const { categoryId } = input
  const appId = context.meta.appId.split('_')[1]
  const tokenHandler = new TokenHandler({
    api: `https://{serviceName}.${config.credentials.baseDomain}/`,
    clientId: config.credentials.clientId,
    clientSecret: config.credentials.clientSecret,
    refreshToken: config.credentials.refreshToken
  })
  const serviceUrl = tokenHandler.credentials.api.replace('{serviceName}', 'product')
  const tokenObj = await tokenHandler.getToken()

  const { statusCode, body } = await request({
    method: 'GET',
    baseUrl: `${serviceUrl}v1`,
    url: `${appId}/categories/${categoryId}`,
    headers: {
      Authorization: `Bearer ${tokenObj.token}`
    },
    json: true,
    timeout: 10000,
    qsStringifyOptions: { arrayFormat: 'brackets' },
    resolveWithFullResponse: true,
    simple: false
  })

  if (statusCode >= 400) {
    throw new ProxyError(statusCode, body, {
      service: 'product',
      version: 'v1',
      path: `${appId}/categories/${categoryId}`,
      method: 'GET'
    })
  }

  return body
}

module.exports = async (context, input) => {
  const { categoryId, sort = 'relevance', offset = 0, limit = 20 } = input

  if (context.config.categoryUseCloudsearch && categoryId && categoryId !== 'sale' && ['priceAsc', 'priceDesc'].includes(sort)) {
    if (limit > 100) {
      const err = new Error('The limit can\'t be greater than 100')
      err.code = 'EVALIDATION'
      throw err
    }

    const category = await getCategory(context, input)
    const invoker = new Invoker(new Requester(context.config.cloudsearchUrls), context.log)
    let queryBuilder = new QueryBuilder(context.config.shopNumber, context.config.languageId)
    queryBuilder = Helper.mapFiltersToQueryBuiler({}, queryBuilder)
    queryBuilder.addCategoryFilter(category.path)
    queryBuilder.setSort(sort)
    queryBuilder.setPagination(offset, limit)
    return invoker.search(queryBuilder)
  }

  return {}
}
