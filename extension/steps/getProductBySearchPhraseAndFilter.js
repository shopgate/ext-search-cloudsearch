const QueryBuilder = require('../cloudsearch/QueryBuilder')
const Invoker = require('../cloudsearch/Invoker')
const Requester = require('../cloudsearch/Requester')
const Helper = require('../Helper')

module.exports = async (context, input) => {
  const { categoryPath, filters, sort = 'relevance', offset = 0, limit = 20 } = input

  if (limit > 100) {
    const err = new Error('The limit can\'t be greater than 100')
    err.code = 'EVALIDATION'
    throw err
  }

  const invoker = new Invoker(new Requester(context.config.cloudsearchUrls), context.log)
  let queryBuilder = new QueryBuilder(context.config)
  queryBuilder = Helper.mapFiltersToQueryBuilder(filters, queryBuilder, categoryPath)
  if (categoryPath && categoryPath !== 'SALE') queryBuilder.addCategoryFilter(categoryPath)

  queryBuilder.setSearchTerm(input.searchPhrase)
  queryBuilder.setSort(sort)
  queryBuilder.setPagination(offset, limit)
  return invoker.search(queryBuilder)
}
