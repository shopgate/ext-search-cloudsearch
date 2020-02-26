const QueryBuilder = require('../cloudsearch/QueryBuilder')
const Invoker = require('../cloudsearch/Invoker')
const Requester = require('../cloudsearch/Requester')
const Helper = require('../Helper')

module.exports = async (context, input) => {
  const { categoryPath, searchPhrase, filters } = input
  const hasFilters = typeof filters === 'object' && Object.keys(filters).length

  if (searchPhrase === undefined && !hasFilters && categoryPath === undefined) {
    const err = new Error('searchPhrase, filters or categoryId has to be set')
    err.code = 'EVALIDATION'
    throw err
  }

  const invoker = new Invoker(new Requester(context.config.cloudsearchUrls), context.log)
  let queryBuilder = new QueryBuilder(context.config.shopNumber, context.config.languageId)

  // add search phrase if set
  if (searchPhrase) queryBuilder.setSearchTerm(searchPhrase)

  // add filters
  queryBuilder = Helper.mapFiltersToQueryBuilder(filters, queryBuilder, categoryPath)

  // add category
  if (categoryPath && categoryPath !== 'SALE') queryBuilder.addCategoryFilter(categoryPath)

  const newFilters = await invoker.getFilters(queryBuilder)
  return { filters: newFilters }
}
