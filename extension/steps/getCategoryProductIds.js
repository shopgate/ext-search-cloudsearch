const { TokenHandler, ExternalBigAPI } = require('@shopgate/bigapi-requester')
const QueryBuilder = require('../cloudsearch/QueryBuilder')
const Invoker = require('../cloudsearch/Invoker')
const Requester = require('../cloudsearch/Requester')
const Helper = require('../Helper')

module.exports = async (context, input) => {
  const { config } = context
  const { categoryId, sort = 'relevance', offset = 0, limit = 20 } = input

  if (categoryId && ['priceAsc', 'priceDesc'].includes(sort)) {
    const tokenHandler = new TokenHandler({
      api: `https://{serviceName}.${config.credentials.baseDomain}/`,
      clientId: config.credentials.clientId,
      clientSecret: config.credentials.clientSecret,
      refreshToken: config.credentials.refreshToken,
      grantType: 'refresh_token'
    })
    const externalBigAPI = new ExternalBigAPI(tokenHandler)
    const { body: category } = await externalBigAPI.request({
      service: 'product',
      version: 'v1',
      path: `${context.meta.appId.split('_')[1]}/categories/${categoryId}`,
      method: 'GET'
    })

    if (limit > 100) {
      const err = new Error('The limit can\'t be greater than 100')
      err.code = 'EVALIDATION'
      throw err
    }

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
