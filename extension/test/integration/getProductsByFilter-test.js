const assert = require('assert')
const pipelineRequester = require('./helper/PipelineRequester')
const categoryFilterPricePriceAsc = require('./data/filter/categoryFilterPrice-priceAsc.json')
const categoryFilterPricePriceDesc = require('./data/filter/categoryFilterPrice-priceDesc.json')
const expectedProductData = require('./data/filter/categoryFilterPrice.json')
const expectedProductDataFilterForManufacturer = require('./data/filter/filterForManufacturer.json')

describe('getProductsByFilter', () => {
  before(async () => {
    await pipelineRequester.init()
  })
  it('should get the correct product data if a filter for a category is passed', async () => {
    const input = {
      'categoryId': '73',
      'limit': 30,
      'offset': 0,
      'sort': 'relevance',
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 2800,
          'maximum': 93900
        }
      }
    }

    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsByFilter.v1', input)
    assert.deepStrictEqual(result.responseData.output, expectedProductData)
  })

  it('should get the correct product data and ordered price asc', async () => {
    const input = {
      'categoryId': '73',
      'limit': 30,
      'offset': 0,
      'sort': 'priceAsc',
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 2800,
          'maximum': 93900
        }
      }
    }

    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsByFilter.v1', input)
    assert.deepStrictEqual(result.responseData.output, categoryFilterPricePriceAsc)
  })

  it('should get the correct product data and ordered price desc', async () => {
    const input = {
      'categoryId': '73',
      'limit': 30,
      'offset': 0,
      'sort': 'priceDesc',
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 2800,
          'maximum': 93900
        }
      }
    }

    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsByFilter.v1', input)
    assert.deepStrictEqual(result.responseData.output, categoryFilterPricePriceDesc)
  })

  it('should get the correct product data if a manufacture filter is set', async () => {
    const input = {
      'categoryId': '73',
      'limit': 30,
      'offset': 0,
      'sort': 'relevance',
      'filters': {
        'manufacturer': {
          'label': 'Marke',
          'source': 'manufacturer',
          'type': 'multiselect',
          'values': [
            'mcRonalds'
          ],
          'valueLabels': [
            'mcRonalds'
          ]
        }
      }
    }
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsByFilter.v1', input)
    assert.deepStrictEqual(result.responseData.output, expectedProductDataFilterForManufacturer)
  })

  it('should throw an error if the request has a limit > 100', async () => {
    const input = {
      'categoryId': '73',
      'limit': 200,
      'offset': 0,
      'sort': 'relevance',
      'filters': {
        'display_amount': {
          'label': 'Preis',
          'type': 'range',
          'minimum': 2800,
          'maximum': 93900
        }
      }
    }
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsByFilter.v1', input)
    assert.ok(result.responseData.error)
    assert.ok(result.responseData.error.code, 'EVALIDATION')
  })
})
