const xregexp = require('xregexp')
const Requester = require('../cloudsearch/Requester')

const TIMEOUT = 700 // 700ms timeout for cloudsearch (had some issued with 500)
const regexCleanRaw = '[^\\pN\\p{Ll}\\p{Lu}\\p{Lt}\\p{Lo}\\-\\.\\| ]'
const regexClean = xregexp(regexCleanRaw, 'g')
const multiWhitespaceRegex = /\s+/g

// Build expression for finding suggestions (from cloudsearch_suggest.php)
// $matchHighlight = '\$start\$(\S+)\$end\$'; // marked term with $start$name$end$
// $matchFollowingTerm = '( ?[& ]*\S{4,})?'; // a word with optional '& ' before it
// $matchSuggestionAndFollowing = '/' . $matchHighlight . $matchFollowingTerm . $matchFollowingTerm . $matchFollowingTerm . '/';
const highlightRegex = /\$start\$(\S+)\$end\$( ?[& ]*\S{4,})?( ?[& ]*\S{4,})?( ?[& ]*\S{4,})?/g

const baseSearchParams = {
  'q.parser': 'structured',
  'q.options': { fields: ['name', 'child_names'] },
  size: 100,
  'highlight.name': { format: 'text', pre_tag: '$start$', post_tag: '$end$' },
  'highlight.child_names': { format: 'text', pre_tag: '$start$', post_tag: '$end$' },
  return: 'name,child_names'
}

/**
 * @param {Object} context
 * @param {Object} context.config
 * @param {string} context.config.languageId (de-de / en-us)
 * @param {string} context.config.cloudsearch-de (e.g. https://search-shopgate-items-de-hdxp45pgwwdvd4umvpq36rejwe.eu-west-1.cloudsearch.amazonaws.com/2013-01-01/search)
 * @param {string} context.config.cloudsearch-en
 * @param {Object} context.meta
 * @param {string} context.meta.appId (shop_12345)
 * @param {function} context.tracedRequest
 * @param {Object} input - Properties depend on the pipeline this is used for
 * @param {Object} input.searchPhrase - the (incomplete) searchPhrase
 * @param {Function} cb
 */
module.exports = async (context, input) => {
  if (input.searchPhrase.length < 2) return { suggestions: [] }

  const requester = new Requester(context.config.cloudsearchUrls)
  const cloudsearchUrl = requester.getUrl(context.config.languageId)
  const shopNumber = context.meta.appId.split('_')[1]

  const suggestQuery = input.searchPhrase
    .replace(regexClean, ' ')
    .replace(multiWhitespaceRegex, ' ')
    .trim()
    .toLowerCase()

  const options = buildRequestOptions(suggestQuery, shopNumber, cloudsearchUrl)

  context.log.debug({ options }, 'sending cloudsearch request')

  const body = await context.tracedRequest(`Cloudsearch`)(options)
  const suggestions = parseResult(suggestQuery, body).slice(0, 10)
  return { suggestions }
}

function parseHighlight (suggestQuery, suggestionsWithCounts, highlight) {
  const highlightParts = highlight.split('$next$')
  for (let j = 0; j < highlightParts.length; j++) {
    const highlightPart = highlightParts[j]
    let match
    while ((match = highlightRegex.exec(highlightPart)) !== null) {
      if (match[1]) {
        addSuggestion(suggestQuery, suggestionsWithCounts, [match[1]])
        if (match[2]) {
          addSuggestion(suggestQuery, suggestionsWithCounts, [match[1], match[2]])
          if (match[3]) {
            addSuggestion(suggestQuery, suggestionsWithCounts, [match[1], match[2], match[3]])
            if (match[4]) {
              addSuggestion(suggestQuery, suggestionsWithCounts, [match[1], match[2], match[3], match[4]])
            }
          }
        }
      }
    }
  }
}

function parseResult (suggestQuery, parsedBody) {
  const suggestionsWithCounts = {}

  if (!parsedBody.hits || !parsedBody.hits.hit || !parsedBody.hits.hit.length) return []

  for (let i = 0; i < parsedBody.hits.hit.length; i++) {
    const hit = parsedBody.hits.hit[i] // == { id: '1', highlights: { name: 'aaa', child_names: 'bbb' } }
    if (hit.highlights.name) parseHighlight(suggestQuery, suggestionsWithCounts, hit.highlights.name)
    if (hit.highlights.child_name) parseHighlight(suggestQuery, suggestionsWithCounts, hit.highlights.child_name)
  }

  // SuggestionsWithCounts is now something like {oneSugg: 1, anotherSugg: 4, anything: 8}
  let suggestionKeys = Object.keys(suggestionsWithCounts)
  let sortableSuggestions = []
  for (let i = 0; i < suggestionKeys.length; i++) {
    sortableSuggestions.push({ key: suggestionKeys[i], count: suggestionsWithCounts[suggestionKeys[i]] })
  }

  // Sort by counts
  sortableSuggestions.sort((a, b) => (a.count < b.count ? 1 : (a.count > b.count ? -1 : 0)))

  const suggestionsLowercaseIndexed = {}
  for (let i = 0; i < sortableSuggestions.length; i++) {
    const lowerCased = sortableSuggestions[i].key.toLowerCase()
    if (suggestionsLowercaseIndexed[lowerCased]) {
      suggestionsLowercaseIndexed[lowerCased].count += sortableSuggestions[i].count
    } else {
      suggestionsLowercaseIndexed[lowerCased] = sortableSuggestions[i]
    }
  }

  // Build array again, that is sortable (but now the summed up counts)
  suggestionKeys = Object.keys(suggestionsLowercaseIndexed)
  sortableSuggestions = []
  for (let i = 0; i < suggestionKeys.length; i++) {
    sortableSuggestions.push({
      key: suggestionsLowercaseIndexed[suggestionKeys[i]].key,
      count: suggestionsLowercaseIndexed[suggestionKeys[i]].count
    })
  }

  // Sort by counts (again, but now the summed up counts)
  sortableSuggestions.sort((a, b) => (a.count < b.count ? 1 : (a.count > b.count ? -1 : 0)))

  // Extract to array of strings
  return sortableSuggestions.map(obj => obj.key)
}

function addSuggestion (suggestQuery, target, matches) {
  // Removes several chars from the beginning and end of the string, also hyphens from the end
  matches = matches.map(term => trimSpecials(term).replace(/[-]+$/g, ''))
  let suggestion = matches.join('')

  // Make sure to remove all highlight and child_name sequences (like '$start$' or '$id123id$')
  suggestion = suggestion.replace(/\$S+?\$/g, '').trim()

  // Skip suggestion if it is shorter than query
  if (suggestion.length < suggestQuery.length) return

  // Add/count suggestion
  if (!target[suggestion]) target[suggestion] = 0
  target[suggestion]++
}

function trimSpecials (str) {
  const chars = ',.+/([{}])\'"'
  let l = 0
  let i = 0
  str += ''

  l = str.length
  for (i = 0; i < l; i++) {
    if (chars.indexOf(str.charAt(i)) === -1) {
      str = str.substring(i)
      break
    }
  }

  l = str.length
  for (i = l - 1; i >= 0; i--) {
    if (chars.indexOf(str.charAt(i)) === -1) {
      str = str.substring(0, i + 1)
      break
    }
  }

  return chars.indexOf(str.charAt(0)) === -1 ? str : ''
}

/**
 * @param {string[]} conditions
 * @param {string} [conjunction=and]
 * @private
 */
function buildConjunction (conditions, conjunction) {
  // Remove falsy elements
  const filtered = conditions.filter(n => n)
  if (filtered.length < 2) return filtered.join('')
  return `(${conjunction} ${filtered.join(' ')})`
}

function buildRequestOptions (suggestQuery, shopNumber, cloudsearchUrl) {
  const queryTerms = suggestQuery.split(' ')
  const queryParts = []
  for (let i = 0; i < queryTerms.length; i++) {
    queryParts.push(buildConjunction([`'${queryTerms[i]}'`, `(prefix '${queryTerms[i]}')`], 'or'))
  }

  const params = Object.assign(baseSearchParams, {
    q: buildConjunction(queryParts, 'and'),
    fq: `shop_number:${shopNumber}`
  })

  stringifyArrayParams(params)

  return {
    uri: cloudsearchUrl,
    qs: params,
    qsStringifyOptions: { format: 'RFC1738' }, // We need '+' instead of '%20'
    timeout: TIMEOUT,
    json: true
  }
}

/**
 * @param queryParams
 */
function stringifyArrayParams (queryParams) {
  const keys = Object.keys(queryParams)
  let counter = keys.length
  while (counter--) {
    if (typeof queryParams[keys[counter]] === 'object') {
      queryParams[keys[counter]] = JSON.stringify(queryParams[keys[counter]])
    }
  }
}
