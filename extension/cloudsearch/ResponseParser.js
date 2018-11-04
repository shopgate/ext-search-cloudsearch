const Helper = require('../Helper')
const Filter = require('./Filter')
const FilterTranslations = require('./FilterTranslations')

const FACET_VALUE_SEPARATOR = require('./QueryBuilder').FACET_VALUE_SEPARATOR
const MAX_RETURN_FACET_SIZE = 200 // original has 500, but at some points its changed 200 for iphone4s
const MIN_RETURN_FACET_SIZE = 1
const MIN_RESULT_SIZE_FOR_FACETS = 3

// in reversed order, because we use it in a reverse-while
const filterSources = ['options', 'properties', 'attributes']

class ResponseParser {
  generateProductNumberList (response) {
    const productNumbers = []
    let totalHits = response && response.hits && response.hits.found ? response.hits.found : 0

    if (totalHits) {
      const numOfHits = response.hits.hit.length
      for (let i = 0; i < numOfHits; i++) {
        if (response.hits.hit[i].fields && typeof response.hits.hit[i].fields.uid === 'string') productNumbers.push(response.hits.hit[i].fields.uid)
      }
    }

    return productNumbers
  }

  /**
   * @param {Object} response
   * @param {string} language
   * @return {Object[]}
   */
  getFilterResponse (response, language) {
    const generateFacets = response.hits.found > MIN_RESULT_SIZE_FOR_FACETS
    const filterNewResponse = generateFacets ? this._generateFilterNew(response) : []

    // manufacture filter position after categories filter
    if (generateFacets && response.facets.manufacturer && response.facets.manufacturer.buckets && response.facets.manufacturer.buckets.length >= MIN_RETURN_FACET_SIZE) {
      filterNewResponse.unshift(this._getManufacturerFilter(response, language))
    }

    // categories filter position after price filter
    if (generateFacets && response.facets.categories && response.facets.categories.buckets && response.facets.categories.buckets.length >= MIN_RETURN_FACET_SIZE) {
      filterNewResponse.unshift(this._getCategoryFilter(response, language))
    }

    // price filter position on top
    const priceRange = this._getPriceRange(response)
    if (priceRange.min || priceRange.max) {
      // price filter should be the first one
      filterNewResponse.unshift(
        new Filter('display_amount', FilterTranslations.getTranslation('price', language), Filter.TYPE_RANGE)
          .setRange(priceRange.min, priceRange.max)
      )
    }

    return filterNewResponse
  }

  /**
   * @param {Object} response
   * @param {Object} response.facets
   * @param {Object[]} response.facets[].buckets
   * @param {string} response.facets[].buckets[].value
   * @param {string} response.facets[].buckets[].count
   * @returns {object}
   */
  _generateReturnFilter (response) {
    const facets = {}
    const filterNames = {}
    let counter = filterSources.length

    while (counter--) {
      const filterSource = filterSources[counter]

      if (!response.facets[filterSource] || !response.facets[filterSource].buckets || !response.facets[filterSource].buckets.length) continue

      facets[filterSource] = {}
      let filterCounter = response.facets[filterSource].buckets.length
      while (filterCounter--) {
        const filter = response.facets[filterSource].buckets[filterCounter]
        const splitted = filter.value.split(FACET_VALUE_SEPARATOR)

        // Don't add filter if name or value is empty or if there is already a filter from another source with the same name
        if (!splitted[1] || !splitted[0] || (filterNames[splitted[0]] && filterNames[splitted[0]] !== filterSource)) continue

        filterNames[splitted[0]] = filterSource

        if (!facets[filterSource][splitted[0]]) facets[filterSource][splitted[0]] = []
        facets[filterSource][splitted[0]].push({value: splitted[1], hits: filter.count})
      }
    }

    return facets
  }

  /**
   * @param {Object} response
   * @return {Object[]} filters
   */
  _generateFilterNew (response) {
    const filters = []
    const facets = this._generateReturnFilter(response)

    for (let source in facets) {
      if (!facets.hasOwnProperty(source)) continue
      const sourceFacets = facets[source]

      for (let displayName in sourceFacets) {
        if (!sourceFacets.hasOwnProperty(displayName)) continue
        const facet = sourceFacets[displayName]

        if (facet.length >= MIN_RETURN_FACET_SIZE) {
          facet.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0))

          const values = []
          for (let entry in facet) {
            if (!facet.hasOwnProperty(entry)) continue

            values.push(new Filter.Value(facet[entry].value, facet[entry].value, facet[entry].hits))

            if (values.length >= MAX_RETURN_FACET_SIZE) break
          }

          Filter.Value.sortValues(values)
          filters.push(new Filter(displayName, displayName, Filter.TYPE_MULTISELECT, source).setValues(values))
        }
      }
    }

    // Sort by label
    filters.sort((a, b) => a.label.localeCompare(b.label, [], {caseFirst: 'upper'}))

    return filters
  }

  _getPriceRange (response) {
    let min = 0
    let max = 0
    let displayAmount = []

    if (response && response.facets && response.facets.display_amount && response.facets.display_amount.buckets) {
      displayAmount = Helper.extract(response.facets.display_amount.buckets, 'value')

      if (displayAmount.length) {
        min = Math.min.apply(null, displayAmount)
        max = Math.max.apply(null, displayAmount)
      }
    }

    return {min, max}
  }

  _getCategoryFilter (response, language) {
    const categories = response.facets.categories.buckets
    let counter = categories.length

    while (counter--) categories[counter].displayname = categories[counter].value.split('=>')

    // remove subcategory if all facet-categories are in the same one
    outerLoop: // for now a label, will be refactored, when we have good test coverage
        for (let i = 0; i <= 10 && categories[0].displayname.length > i; i++) {
          const comparisonValue = categories[0].displayname[i]
          const catCount = categories.length

          // skip first one
          for (let h = 1; h < catCount; h++) {
            if (categories[h].displayname.length < 2) break outerLoop
            if (categories[h].displayname.length < i || categories[h].displayname[i] !== comparisonValue) break outerLoop
          }

          for (let h = 1; h < catCount; h++) categories[h].displayname.splice(i, 1)
        }

    const values = []
    let catCount = categories.length
    for (let i = 0; i < catCount; i++) {
      values.push(new Filter.Value(categories[i].value, categories[i].displayname.join(' » '), categories[i].count))
    }

    return new Filter('categories', FilterTranslations.getTranslation('category', language), Filter.TYPE_MULTISELECT, 'categories')
        .setValues(values)
  }

  _getManufacturerFilter (response, language) {
    const manufacturer = response.facets.manufacturer.buckets
    let counter = manufacturer.length

    // sort alphabetically, case-insensitive
    manufacturer.sort((a, b) => {
      const strA = a.value.toLowerCase()
      const strB = b.value.toLowerCase()
      return (strA > strB) ? 1 : ((strB > strA) ? -1 : 0)
    })

    const values = []
    for (let i = 0; i < counter; i++) {
      values.push(new Filter.Value(manufacturer[i].value, manufacturer[i].value, manufacturer[i].count))
    }

    return new Filter('manufacturer', FilterTranslations.getTranslation('manufacturer', language), Filter.TYPE_MULTISELECT, 'manufacturer')
        .setValues(values)
  }
}

module.exports = ResponseParser
