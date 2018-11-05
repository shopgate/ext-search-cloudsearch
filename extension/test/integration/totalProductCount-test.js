const assert = require('assert')
const pipelineRequester = require('./helper/PipelineRequester')

describe('getTotalProductCount', () => {
  before(async () => {
    await pipelineRequester.init()
  })

  it('should output the correct number of products on a search request', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getTotalProductCountBySearchPhrase.v1', { searchPhrase: 'Product' })
    assert.equal(result.responseData.output.totalProductCount, 168)
  })

  it('should output the correct number of products on a filter request', async () => {
    const input = {
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 2800,
          'maximum': 93900
        }
      }
    }
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getTotalProductCountByFilter.v1', input)
    assert.equal(result.responseData.output.totalProductCount, 137)
  })
})
