const assert = require('assert')
const pipelineRequester = require('./helper/PipelineRequester')
const expectedProductData = require('./data/search/productSearchInclFilter.json')

describe('getProductsBySearchPhraseAndFilter', () => {
  before(async () => {
    await pipelineRequester.init()
  })
  it('should get the correct product data if the search term is "product with" and a filter is set', async () => {
    const input = {
      'searchPhrase': 'Product with',
      'limit': 30,
      'offset': 0,
      'sort': 'relevance',
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 600,
          'maximum': 93900
        }
      }
    }
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsBySearchPhraseAndFilter.v1', input)
    assert.deepStrictEqual(result.responseData.output, expectedProductData)
  })
  it('should throw an error if the request has a limit > 100', async () => {
    const input = {
      'searchPhrase': 'Product with',
      'limit': 200,
      'offset': 0,
      'sort': 'relevance',
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 600,
          'maximum': 93900
        }
      }
    }
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsBySearchPhraseAndFilter.v1', input)
    assert.ok(result.responseData.error)
    assert.ok(result.responseData.error.code, 'EVALIDATION')
  })
})
