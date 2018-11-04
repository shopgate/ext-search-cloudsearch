const ResponseParser = require('./ResponseParser')

class Invoker {
  /**
   * @param {Requester} requester
   * @param {ResponseParser} responseParser
   * @param {object} log
   */
  constructor (requester, log) {
    this.requester = requester
    this.responseParser = new ResponseParser()
    this.log = log
  }

  /**
   * fires a search request against cloudsearch, if getFilters is true, there is no limitation for prices
   * and the limit-parameter is set to zero, to only return facets. If we would limit for prices too, for
   * the filters-request, the price range would lie, we need this one absolutely, not relative to the other
   * filters
   * @param {QueryBuilder} queryBuilder
   */
  async search (queryBuilder) {
    let query = queryBuilder.buildSearchQuery(false)

    const shopLanguage = queryBuilder.shopLanguage

    this.log.info({
      cloudsearchQuery: JSON.stringify(query)
    }, 'Requesting cloudsearch')

    const result = await this.requester.request(query, shopLanguage)
    const foundHits = !!(result && result.hits && result.hits.found)

    if (foundHits) return this._sanitizeOutput(result)

    // no result found with a direct search. Try fuzzy search
    const fuzzyQuery = queryBuilder.buildSearchQuery(true)
    const fuzzyResult = await this.requester.request(fuzzyQuery, shopLanguage)
    return this._sanitizeOutput(fuzzyResult)
  }

  /**
   * @param {QueryBuilder} queryBuilder
   */
  async getFilters (queryBuilder) {
    let query = queryBuilder.buildSearchQuery(false, true)
    this.log.info({
      cloudsearchQuery: JSON.stringify(query)
    }, 'Requesting cloudsearch')

    const shopLanguage = queryBuilder.shopLanguage

    const result = await this.requester.request(query, shopLanguage)
    const foundHits = !!(result && result.hits && result.hits.found)
    if (foundHits) return this.responseParser.getFilterResponse(result, shopLanguage)

    const fuzzyQuery = queryBuilder.buildSearchQuery(true, true)
    const fuzzyResult = this.requester.request(fuzzyQuery, shopLanguage)
    return this.responseParser.getFilterResponse(fuzzyResult, shopLanguage)
  }

  _sanitizeOutput ({ hits }) {
    if (!hits) return { productIds: [], totalProductCount: 0 }
    return {
      productIds: hits.hit.map((hit) => {
        return hit.fields.uid
      }),
      totalProductCount: hits.found
    }
  }
}

module.exports = Invoker
