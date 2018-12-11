const Helper = require('../Helper')
const xregexp = require('xregexp')
const Hypher = require('hypher')
const germanHypher = new Hypher(require('hyphenation.de'))

// allow all unicode numbers, lower-, upper-, title-, other letters, "-", ".", "|", and " "
const regexCleanRaw = '[^\\pN\\p{Ll}\\p{Lu}\\p{Lt}\\p{Lo}\\-\\.\\| ]'
const regexClean = xregexp(regexCleanRaw, 'g')

// added "," and "_" compared to default regex rule
const customRegexCleanRaw = '[^\\pN\\p{Ll}\\p{Lu}\\p{Lt}\\p{Lo}\\-_\\.\\,\\| ]'
const customRegexClean = xregexp(customRegexCleanRaw, 'g')

// safely replace "-" at the beginning & end of the string
const regexTrim = /^([-\s])*|([-\s])*$/g

// Special treatment for search of item numbers
const regexItemNumbers = /['\\]/g

// Separate words on certain transitions (number to letter, letter to number, lower- to uppercase
const transitionRegex = /(?:(\d)([a-zA-Z]))|(?:([a-zA-Z])(\d))|(([a-z])([A-Z]))/g
const normalizationRegexRaw = '[^\\pN\\p{Ll}\\p{Lu}\\p{Lt}\\p{Lo} ]'
const normalizationRegex = xregexp(normalizationRegexRaw, 'g')
const softHyphenSplit = /\u00AD/ug

const FACET_VALUE_SEPARATOR = '$fv$'
const FACET_SIZE = 5000
const FACET_SIZE_CATEGORIES = 20

const SORT_RELEVANCE = 0
const SORT_PRICE_ASC = 1
const SORT_PRICE_DESC = 2
const SORT_RANDOM = 4

const LANG_DE = 'de-de'

class QueryBuilder {
  constructor (shopNumber, shopLanguage) {
    this.shopNumber = shopNumber
    this.shopLanguage = shopLanguage
    this.searchTerm = null
    this.priceRange = null
    this.offset = 0
    this.limit = 25
    this.sort = 'relevance'
    this.filters = {}
    this.filterKeys = []
  }

  setSearchTerm (searchTerm) {
    this.searchTerm = searchTerm
    return this
  }

  setPriceRange (minPrice, maxPrice) {
    this.priceRange = [minPrice, maxPrice]
    return this
  }

  setPagination (offset, limit) {
    this.offset = offset
    this.limit = limit
    return this
  }

  setSort (sort) {
    this.sort = sort
    return this
  }

  /**
   * @param {Object} filters
   * @returns {QueryBuilder}
   */
  setFilters (filters) {
    this.filters = this._formatFilters(filters)
    this.filterKeys = Object.keys(this.filters)
    return this
  }

  /**
   * overwrites potential category-filters, added by setFilters
   * @param {string} value - name of the category
   */
  addCategoryFilter (value) {
    if (!this.filters.categories) this.filterKeys.push('categories')
    this.filters.categories = { source: 'categories', key: 'categories', values: [value] }
  }

  hasPriceFilter () {
    return this.priceRange && this.priceRange.length &&
        (Number.isFinite(this.priceRange[0]) || Number.isFinite(this.priceRange[1]))
  }

  /**
   * @param {boolean} [fuzzy=false]
   * @param {boolean} [forFilters=false]
   * @returns {Object}
   */
  buildSearchQuery (fuzzy, forFilters) {
    let term = this.searchTerm || ''

    let searchQuery = this._buildSearchTermQuery(term)
    if (fuzzy) {
      searchQuery = `${this._trimQueryString(term.toLowerCase(), 60)}~2`
    }

    const queryParams = this._setupQueryParams(searchQuery, !forFilters)
    if (forFilters) {
      this._addFacetsToQueryParams(queryParams)
      queryParams.size = 0 // no results, just facets!
    }
    this._addSortParams(queryParams)

    if (term && !forFilters) {
      this._addHighlighting(queryParams)
    }

    return queryParams
  }

  _addHighlighting (params) {
    // Add highlight fields to return fields to avoid server error with cloudsearch.
    params.return = 'name,uid,child_names,attributes_searchable'
    params['highlight.name'] = { format: 'text', pre_tag: '$start$', post_tag: '$end$' }
    params['highlight.child_names'] = { format: 'text', pre_tag: '$start$', post_tag: '$end$' }
    params['highlight.attributes_searchable'] = { format: 'text', pre_tag: '$start$', post_tag: '$end$' }
  }

  _formatFilters (filters) {
    const filterKeys = Object.keys(filters)
    const ignoredFilters = {
      'display_amount >=': true,
      'display_amount <=': true,
      'onlyActive': true,
      'only_discounted': true
    }

    let key
    let counter = filterKeys.length
    while (counter--) {
      key = filterKeys[counter]
      if (ignoredFilters[key]) continue

      // In node 10, arrays have a method called "values"...
      if (!filters[key].values || typeof filters[key].values === 'function') {
        filters[key] = { values: filters[key] }
      }

      if (!filters[key].values.length) {
        delete filters[key]
        continue
      }

      filters[key].source = filters[key].source || key
      if (!Array.isArray(filters[key].values)) filters[key].values = [filters[key].values]
    }

    return filters
  }

  /**
   * @param params
   * @private
   */
  _addFacetsToQueryParams (params) {
    params['facet.attributes'] = { sort: 'bucket', size: FACET_SIZE }
    params['facet.options'] = { sort: 'bucket', size: FACET_SIZE }
    params['facet.properties'] = { sort: 'bucket', size: FACET_SIZE }

    if (!this.filters.categories || !this.filters.categories.values.length) {
      params['facet.categories'] = { sort: 'count', size: FACET_SIZE_CATEGORIES }
    }

    if (!this.filters.manufacturer || !this.filters.manufacturer.values.length) {
      params['facet.manufacturer'] = { sort: 'bucket', size: FACET_SIZE }
    }

    params['facet.display_amount'] = { sort: 'bucket', size: FACET_SIZE }
  }

  _addSortParams (params) {
    switch (this.sort) {
      case 'priceAsc':
        params.sort = 'display_amount asc'
        break
      case 'priceDesc':
        params.sort = 'display_amount desc'
        break
      case 'random':
        // Math.floor(Math.random()*(max-min+1)+min) => min=1 max=100
        // _rand alone doesn't change between requests
        params.sort = 'random desc'
        params['expr.random'] = `sin(_rand*${Math.floor(Math.random() * 101)})`
        break
      case 'relevance':
      default: // By default use relevance for sorting
        params.sort = '_score desc'
    }
  }

  /**
   * Example queries for testing that made problems in the past:
   * PI-440:  "408 || 407 || 419 || 404 || 403 || 405 || 406" ("||" is used by factfinder)
   * PI-742:  "hotel zur linde" ("zur" is a stopword)
   * PI-1316: "chef’s choice" (don't replace "'" with space)
   * @param term
   * @param limit
   * @param {RegExp} [customRegex]
   * @private
   */
  _trimQueryString (term, limit, customRegex) {
    let string = term.trim().substr(0, limit)
    return string.replace(customRegex || regexClean, ' ').replace(regexTrim, '')
  }

  _buildSearchTermQuery (term) {
    if (!term || term === '*') return ''

    const queryParts = this._buildSearchTermQueryParts(term)
    return this._buildConjunction(queryParts, 'or')
  }

  /**
   * @param {string} term
   * @returns {Array}
   * @private
   */
  _buildSearchTermQueryParts (term) {
    const parts = []
    const termTrimmed = this._trimQueryString(term, 60, customRegexClean)

    let normalizedSingleTerms = this._normalizeSearchTerm(term)
    let hyphenatedSingleTerms = this._hyphenateSearchTerm(normalizedSingleTerms)

    normalizedSingleTerms = normalizedSingleTerms.split(' ').filter(entry => entry.trim() !== '')
    hyphenatedSingleTerms = hyphenatedSingleTerms.split(' ').filter(entry => entry.trim() !== '')

    const singleHyphenatedTermQueries = hyphenatedSingleTerms.map(term => `'${term}'`)

    // Connect single terms so that every word has to be found
    parts.push(this._buildConjunction(singleHyphenatedTermQueries, 'and'))

    // As above, but performs the search in some certain, specified field
    parts.push(this._buildQueryForField(singleHyphenatedTermQueries, 'item_numbers'))

    if (singleHyphenatedTermQueries.length > 1) {
      // Additionally search for whole phrase when there are several single terms (to match phrases with stopwords)
      parts.push(`(term boost=2 '${termTrimmed}')`)
    }

    if (termTrimmed.length > 1) {
      // Prefix search if term is as least 2 characters long
      parts.push(`(prefix '${termTrimmed}')`)
    }

    if (normalizedSingleTerms.length > 1) {
      const singleTermParts = []
      for (let i = 0; i < normalizedSingleTerms.length; i++) {
        const testTerm = normalizedSingleTerms[i].replace(/'/g, '')
        if (Number.isFinite(parseFloat(testTerm)) || testTerm.length <= 2) continue
        singleTermParts.push(`(prefix field=name '${normalizedSingleTerms[i]}')`)
      }
      if (singleTermParts.length) parts.push(this._buildConjunction(singleTermParts))
    }

    // Special treatment for search of item numbers
    const itemNumberTerm = termTrimmed.replace(regexItemNumbers, ' ').trim()
    parts.push(`item_numbers:'${itemNumberTerm}'`)

    return parts
  }

  _normalizeSearchTerm (term) {
    let match
    while ((match = transitionRegex.exec(term)) !== null) {
      term = term.substr(0, match.index + 1) + ' ' + term.substr(match.index + 1)
    }
    return term.replace(/\s+/g, ' ').toLowerCase().replace(normalizationRegex, ' ')
  }

  /**
   * Hyphenate a string for de-de locale
   * @param {string} term
   * @returns {string}
   * @private
   */
  _hyphenateSearchTerm (term) {
    if (this.shopLanguage !== LANG_DE) {
      return term
    }
    return germanHypher.hyphenateText(term).replace(softHyphenSplit, ' ')
  }

  /**
   * @param {string[]} conditions
   * @param {string} [conjunction=and]
   * @private
   */
  _buildConjunction (conditions, conjunction) {
    conjunction = conjunction || 'and'

    // remove falsy elements
    const filtered = conditions.filter(n => n)

    if (filtered.length < 2) return filtered.join('')
    return `(${conjunction} ${filtered.join(' ')})`
  }

  _buildQueryForField (conditions, field) {
    // remove falsy elements
    const filtered = conditions.filter(n => n)
    const output = filtered.map(el => `(prefix field='${field}' ${el})`)
    return this._buildConjunction(output, 'and')
  }

  /**
   *
   * @param {String} [query=matchall]
   * @param {Boolean} [withPriceCondition=true]
   * @private
   */
  _setupQueryParams (query, withPriceCondition) {
    withPriceCondition = withPriceCondition === undefined ? true : withPriceCondition
    const params = {
      'return': 'uid',
      'q.options': {
        'fields': [
          'name^2',
          'child_names',
          'item_numbers',
          'tags',
          'categories_searchable',
          'attributes_searchable',
          'options_searchable',
          'properties_searchable',
          'manufacturer_searchable',
          'name_normalized^0.5'
        ]
      },
      'fq': this._buildConjunction(this._getFilterConditions(withPriceCondition))
    }

    if (!query || query.substr(0, 1) === '(') {
      params['q.parser'] = 'structured'
    }

    params.q = query || 'matchall'

    if (this.offset) params.start = this.offset
    params.size = this.limit

    return params
  }

  /**
   * @param {Boolean} withPriceCondition
   * @returns {string[]}
   * @private
   */
  _getFilterConditions (withPriceCondition) {
    const output = [`shop_number:${this.shopNumber}`, this._buildSearchQueryForFilters()]
    if (withPriceCondition) {
      output.push(this._buildSearchQueryForPriceFilter())
    }
    return output
  }

  _buildSearchQueryForFilters () {
    const ignoredFilters = {
      'display_amount >=': true,
      'display_amount <=': true,
      'onlyActive': true
    }
    const searchQueries = []

    let key, filterStrings
    let counter = this.filterKeys.length
    while (counter--) {
      filterStrings = []
      key = this.filterKeys[counter]

      // Ignore special filters
      if (ignoredFilters[key]) continue

      if (key === 'only_discounted') {
        if (this.filters[key]) filterStrings.push('discount:{1,}')
        else continue
      } else {
        filterStrings = this._getFilterStringsFromValues(key, this.filters[key])
      }

      if (filterStrings.length === 1) searchQueries.push(filterStrings.pop())
      else searchQueries.push(`(or ${filterStrings.join(' ')})`)
    }

    return searchQueries.join(' ')
  }

  _buildSearchQueryForPriceFilter () {
    if (!this.hasPriceFilter()) {
      return ''
    }

    let output = ''
    output += 'display_amount:'
    output += Number.isFinite(this.priceRange[0]) ? `[${this.priceRange[0]}` : '{'
    output += ','
    output += Number.isFinite(this.priceRange[1]) ? `${this.priceRange[1]}]` : '}'

    return output
  }

  /**
   * @param {String} key
   * @param {Object} filter
   * @param {String} filter.source
   * @param {String[]|number[]|boolean[]} filter.values
   * @private
   */
  _getFilterStringsFromValues (key, filter) {
    const filterStrings = []
    let value
    let filterCounter = filter.values.length

    while (filterCounter--) {
      value = Helper.addcslashes(filter.values[filterCounter], "'\\")

      switch (filter.source) {
        case 'manufacturer':
          filterStrings.push(`${filter.source}:'${value}'`)
          break
        case 'categories':
          // Search with prefix to match items in sub-categories
          filterStrings.push(`(or (prefix field=${filter.source} '${value}=>')(phrase field=${filter.source} '${value}'))`)
          break
        case 'attributes':
        case 'options':
        case 'properties':
          // Build field value with filter key and value
          filterStrings.push(`${filter.source}:'${key}${FACET_VALUE_SEPARATOR}${value}'`)
          break
        default:
          // Fallback for unknown source (old format) and search in all three filter fields
          filterStrings.push(`attributes:'${key}${FACET_VALUE_SEPARATOR}${value}'`)
          filterStrings.push(`options:'${key}${FACET_VALUE_SEPARATOR}${value}'`)
          filterStrings.push(`properties:'${key}${FACET_VALUE_SEPARATOR}${value}'`)
      }
    }

    return filterStrings
  }
}

module.exports = QueryBuilder
module.exports.FACET_VALUE_SEPARATOR = FACET_VALUE_SEPARATOR
module.exports.SORT_RELEVANCE = SORT_RELEVANCE
module.exports.SORT_PRICE_ASC = SORT_PRICE_ASC
module.exports.SORT_PRICE_DESC = SORT_PRICE_DESC
module.exports.SORT_RANDOM = SORT_RANDOM
module.exports.LANG_DE = LANG_DE
