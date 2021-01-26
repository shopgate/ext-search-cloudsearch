const QueryBuilder = require('../cloudsearch/QueryBuilder')
const Invoker = require('../cloudsearch/Invoker')
const Requester = require('../cloudsearch/Requester')

module.exports = async (context, { searchPhrase, sort = 'relevance', offset = 0, limit = 20 }) => {
  if (limit > 100) {
    const err = new Error('The limit can\'t be greater than 100')
    err.code = 'EVALIDATION'
    throw err
  }

  const invoker = new Invoker(new Requester(context.config.cloudsearchUrls), context.log)
  const queryBuilder = new QueryBuilder(context.config)
  queryBuilder.setSearchTerm(searchPhrase)
  queryBuilder.setSort(sort)
  queryBuilder.setPagination(offset, limit)
  return invoker.search(queryBuilder)
}
