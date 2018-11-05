const assert = require('assert')
const pipelineRequester = require('./helper/PipelineRequester')
const expectedProductData = require('./data/search/productSearch.json')
const expectedProductDataPriceAsc = require('./data/search/productSearch-priceAsc.json')

describe('search', () => {
  before(async () => {
    await pipelineRequester.init()
  })
  it('should get the correct product data if the search term is product', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsBySearchPhrase.v1', { searchPhrase: 'Product' })
    assert.deepStrictEqual(result.responseData.output, expectedProductData)
  })
  it('should get the product data in the correct order - priceAsc', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsBySearchPhrase.v1', { searchPhrase: 'Product', sort: 'priceAsc' })
    assert.deepStrictEqual(result.responseData.output, expectedProductDataPriceAsc)
  })
  it('should get the product data in the correct order - priceAsc', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsBySearchPhrase.v1', { searchPhrase: 'Product', sort: 'priceAsc' })
    assert.deepStrictEqual(result.responseData.output, expectedProductDataPriceAsc)
  })
  it('should throw an error if the limit is > 200', async () => {
    const result = await pipelineRequester.doPipelineRequest('shopgate.catalog.getProductsBySearchPhrase.v1', { searchPhrase: 'Product', limit: 200 })
    assert.deepStrictEqual(result.responseData.error.code, 'EVALIDATION')
  })
})
