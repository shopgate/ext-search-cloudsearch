const assert = require('assert')
const pipelineRequester = require('./helper/PipelineRequester')
const getFilterSearchTerm = require('./data/filter/getFilter-searchTerm.json')

describe('getFilters', () => {
  before(async () => {
    await pipelineRequester.init()
  })

  it('should return correct filter for a category', async () => {
    const output = {
      'filters': [
        {
          'id': 'display_amount',
          'label': 'Preis',
          'type': 'range',
          'minimum': 1500,
          'maximum': 8900
        },
        {
          'id': 'Weight',
          'label': 'Weight',
          'type': 'multiselect',
          'source': 'properties',
          'values': [{ 'id': '5.0000', 'label': '5.0000', 'hits': 5 }]
        }
      ]
    }
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getFilters.v1', { categoryId: 59 })
    assert.deepStrictEqual(result.responseData.output, output)
  })

  it('should return correct filter for search', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getFilters.v1', { searchPhrase: 'product' })
    assert.deepStrictEqual(result.responseData.output, getFilterSearchTerm)
  })

  it('should fail if no category or search phrase is given', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getFilters.v1', { })
    assert.ok(result.responseData.error)
    assert.ok(result.responseData.error.code, 'EVALIDATION')
  })
})
