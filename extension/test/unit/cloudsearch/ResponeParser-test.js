const ResponseParser = require('../../../cloudsearch/ResponseParser')
const assert = require('assert')

describe('cloudsearch/ResponseParser', function () {
  let parser

  beforeEach(() => {
    parser = new ResponseParser()
  })

  describe('generateProductIdList', () => {
    it('should generate a list', () => {
      const response = { hits: { found: 10, hit: [{ fields: { uid: '123' } }, { fields: { uid: '234' } }] } }
      const expected = ['123', '234']
      assert.deepEqual(parser.generateProductNumberList(response), expected)
    })

    it('should not try to generate a list when found is 0', () => {
      const response = { hits: { found: 0, hit: [{ fields: { uid: '123' } }, { fields: { uid: '234' } }] } }
      assert.deepEqual(parser.generateProductNumberList(response), [])
    })
  })

  describe('generateReturnFilter', () => {
    it('should generate return filters with all sources', () => {
      const response = {facets: {
        options: {buckets: [{value: 'aa$fv$bb', count: 10}, {value: 'cc$fv$dd', count: 20}]},
        properties: {buckets: [{value: '', count: 9}, {value: 'cc$fv$dd', count: 15}]},
        attributes: {buckets: [{value: 'hh$fv$jj', count: 8}, {value: 'cc$fv$dd', count: 13}]}
      }}

      const expected = {
        attributes: {cc: [{hits: 13, value: 'dd'}], hh: [{hits: 8, value: 'jj'}]},
        options: {aa: [{hits: 10, value: 'bb'}]},
        properties: {}
      }

      assert.deepEqual(parser._generateReturnFilter(response), expected)
    })

    it('should generate return filters with incomplete sources', () => {
      const response = {facets: {options: {buckets: []}, properties: {}}}
      assert.deepEqual(parser._generateReturnFilter(response), {})
    })
  })

  describe('_getManufacturerFilter', () => {
    it('should return a sorted manufacturer filter', () => {
      const mans = [{value: 'fff', count: 1}, {value: 'DhH', count: 3}, {value: 'aGG', count: 6}]
      const response = {facets: {manufacturer: {buckets: mans}}}
      const expected = {
        label: 'Marke',
        id: 'manufacturer',
        source: 'manufacturer',
        type: 'multiselect',
        values: [
          {label: 'aGG', id: 'aGG', hits: 6},
          {label: 'DhH', id: 'DhH', hits: 3},
          {label: 'fff', id: 'fff', hits: 1}
        ]
      }
      assert.deepEqual(parser._getManufacturerFilter(response, 'de-de'), expected)
    })
  })

  describe('_getCategoryFilter', () => {
    it('should return a correct category filter', () => {
      const response = {facets: {categories: {buckets: [
        {displayname: 'A => B => C', value: 'C', count: 3},
        {displayname: 'A => B', value: 'B', count: 4},
        {displayname: 'C', value: 'C', count: 6}
      ]}}}

      const expected = {
        label: 'Kategorie',
        id: 'categories',
        type: 'multiselect',
        source: 'categories',
        values: [
          {label: 'C', id: 'C', hits: 3},
          {label: 'B', id: 'B', hits: 4},
          {label: 'C', id: 'C', hits: 6}
        ]
      }
      assert.deepEqual(parser._getCategoryFilter(response, 'de-de'), expected)
    })

    it('should return a correct category filter with subcategory removal', () => {
      const response = {facets: {categories: {buckets: [
        {displayname: 'A => B => C => X', value: 'C', count: 3},
        {displayname: 'A => B => C => Y', value: 'B', count: 4},
        {displayname: 'A => B => C => Z', value: 'D', count: 6}
      ]}}}

      const expected = {
        label: 'Category',
        id: 'categories',
        type: 'multiselect',
        source: 'categories',
        values: [
          {label: 'C', id: 'C', hits: 3},
          {label: 'B', id: 'B', hits: 4},
          {label: 'D', id: 'D', hits: 6}
        ]
      }
      assert.deepEqual(parser._getCategoryFilter(response), expected)
    })
  })

  describe('generateFilterNewResponse', () => {
    it('should generate without facets with totalHits < 4', () => {
      const response = {hits: {found: 2}, facets: {display_amount: {buckets: [{value: 100}, {value: 200}]}}}
      const expected = [{
        label: 'Price',
        id: 'display_amount',
        type: 'range',
        minimum: 100,
        maximum: 200
      }]
      assert.deepEqual(parser.getFilterResponse(response), expected)
    })

    it('should generate facets with totalHits > 3', () => {
      const response = {
        hits: {found: 10},
        facets: {
          categories: {buckets: [{displayname: 'a', value: 'a', count: 1}, {displayname: 'b', value: 'b', count: 1}]},
          manufacturer: {buckets: [{value: 'c', count: 1}, {value: 'd', count: 1}]},
          display_amount: {buckets: [{value: 1}, {value: 2}]}
        }
      }

      const expected = [{
        label: 'Price',
        id: 'display_amount',
        maximum: 2,
        minimum: 1,
        type: 'range'
      }, {
        label: 'Category',
        id: 'categories',
        source: 'categories',
        type: 'multiselect',
        values: [
          {label: 'a', id: 'a', hits: 1},
          {label: 'b', id: 'b', hits: 1}
        ]
      }, {
        label: 'Brand',
        id: 'manufacturer',
        source: 'manufacturer',
        type: 'multiselect',
        values: [
          {label: 'c', id: 'c', hits: 1},
          {label: 'd', id: 'd', hits: 1}
        ]
      }]

      assert.deepEqual(parser.getFilterResponse(response), expected)
    })
  })

  describe('_generateFilterNew', () => {
    it('should generate sorted filters', () => {
      const response = {facets: {
        attributes: {buckets: [
          {value: 'Breite$fv$10', count: 10},
          {value: 'Breite$fv$145', count: 9},
          {value: 'Breite$fv$12', count: 12},
          {value: 'Höhe$fv$120', count: 20},
          {value: 'Höhe$fv$5', count: 12},
          {value: 'höhe$fv$30', count: 3},
          {value: 'Preite$fv$10', count: 10},
          {value: 'Preite$fv$145', count: 9}
        ]}
      }}

      const expected = [{
        id: 'Breite',
        label: 'Breite',
        source: 'attributes',
        type: 'multiselect',
        values: [
          {hits: 10, id: '10', label: '10'},
          {hits: 12, id: '12', label: '12'},
          {hits: 9, id: '145', label: '145'}
        ]
      }, {
        id: 'Höhe',
        label: 'Höhe',
        source: 'attributes',
        type: 'multiselect',
        values: [
          {hits: 20, id: '120', label: '120'},
          {hits: 12, id: '5', label: '5'}
        ]
      }, {
        id: 'höhe',
        label: 'höhe',
        source: 'attributes',
        type: 'multiselect',
        values: [
          {hits: 3, id: '30', label: '30'}
        ]
      }, {
        id: 'Preite',
        label: 'Preite',
        source: 'attributes',
        type: 'multiselect',
        values: [
          {hits: 10, id: '10', label: '10'},
          {hits: 9, id: '145', label: '145'}
        ]
      }]
      assert.deepEqual(parser._generateFilterNew(response), expected)
    })
  })
})
