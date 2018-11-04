const QueryBuilder = require('../../../cloudsearch/QueryBuilder')
const LANG_DE = QueryBuilder.LANG_DE
const assert = require('assert')

describe('cloudsearch/QueryBuilder', function () {
  let builder

  beforeEach(() => {
    builder = new QueryBuilder('123', 'en-en')
  })

  describe('buildSearchQuery', () => {
    it('should build query for items search with empty searchPhrase but category filter', () => {
      builder.addCategoryFilter('Category')
      builder.buildSearchQuery()
      const query = builder.buildSearchQuery(false, false)
      assert.equal(query.fq, "(and shop_number:123 (or (prefix field=categories 'Category=>')(phrase field=categories 'Category')))")
      assert.equal(query.q, 'matchall')
      assert.equal(query.sort, '_score desc')
    })

    it('should build a complex query 1', () => {
      const filters = {
        'f1': { values: ['v1', 'v2'], source: 'properties' },
        'f2': { values: 'v3' },
        'f3': 'v4',
        'f4': ['v5', 'v6'],
        'onlyActive': 1,
        'only_discounted': 1
      }
      builder.setPriceRange(200, 1500).setPagination(2, 10).setSort('priceDesc').setFilters(filters).shopLanguage = LANG_DE
      const result = builder.setSearchTerm('ein qu3ery mit mehReren silben und trennstrich - 3 - ').buildSearchQuery()

      assert.equal(result['q.parser'], 'structured')
      assert.equal(result.start, 2)
      assert.equal(result.size, 10)
      assert.equal(typeof result['facet.attributes'], 'undefined')
      assert.equal(typeof result['facet.options'], 'undefined')
      assert.equal(typeof result['facet.properties'], 'undefined')
      assert.equal(typeof result['facet.categories'], 'undefined')
      assert.equal(typeof result['facet.manufacturer'], 'undefined')
      assert.equal(typeof result['facet.display_amount'], 'undefined')
      assert.equal(result.sort, 'display_amount desc')
      assert.deepEqual(result['highlight.name'], { format: 'text', pre_tag: '$start$', post_tag: '$end$' })
      assert.deepEqual(result['highlight.child_names'], { format: 'text', pre_tag: '$start$', post_tag: '$end$' })
      assert.deepEqual(result['highlight.attributes_searchable'], { format: 'text', pre_tag: '$start$', post_tag: '$end$' })

      assert.equal(result.fq, '(and shop_number:123 discount:{1,} (or attributes:\'f4$fv$v6\' options:\'f4$fv$v6\' properties:\'f4$fv$v6\' attributes:\'f4$fv$v5\' options:\'f4$fv$v5\' properties:\'f4$fv$v5\') (or attributes:\'f3$fv$v4\' options:\'f3$fv$v4\' properties:\'f3$fv$v4\') (or attributes:\'f2$fv$v3\' options:\'f2$fv$v3\' properties:\'f2$fv$v3\') (or properties:\'f1$fv$v2\' properties:\'f1$fv$v1\') display_amount:[200,1500])')
      assert.equal(result.q, "(or (and 'ein' 'qu' '3' 'ery' 'mit' 'meh' 're' 'ren' 'sil' 'ben' 'und' 'trenn' 'strich' '3') (and (prefix field='item_numbers' 'ein') (prefix field='item_numbers' 'qu') (prefix field='item_numbers' '3') (prefix field='item_numbers' 'ery') (prefix field='item_numbers' 'mit') (prefix field='item_numbers' 'meh') (prefix field='item_numbers' 're') (prefix field='item_numbers' 'ren') (prefix field='item_numbers' 'sil') (prefix field='item_numbers' 'ben') (prefix field='item_numbers' 'und') (prefix field='item_numbers' 'trenn') (prefix field='item_numbers' 'strich') (prefix field='item_numbers' '3')) (term boost=2 'ein qu3ery mit mehReren silben und trennstrich - 3') (prefix 'ein qu3ery mit mehReren silben und trennstrich - 3') (and (prefix field=name 'ein') (prefix field=name 'ery') (prefix field=name 'mit') (prefix field=name 'meh') (prefix field=name 'reren') (prefix field=name 'silben') (prefix field=name 'und') (prefix field=name 'trennstrich')) item_numbers:'ein qu3ery mit mehReren silben und trennstrich - 3')")
    })

    it('should build a complex query 2', () => {
      const filters = {
        'f1': { values: ['v1', 'v2'], source: 'properties' },
        'f2': { values: 'v3' },
        'f3': 'v4',
        'f4': ['v5', 'v6'],
        'only_discounted': 0
      }
      builder.setPriceRange(200, 1500).setPagination(0, 0).setSort('priceAsc').setFilters(filters).shopLanguage = LANG_DE
      const result = builder.setSearchTerm('ein qu3ery mit mehReren silben und trennstrich - 3 - ').buildSearchQuery()

      assert.equal(result['q.parser'], 'structured')
      assert.equal(typeof result.start, 'undefined')
      assert.equal(result.size, 0)
      assert.equal(result.sort, 'display_amount asc')

      assert.equal(result.fq, "(and shop_number:123 (or attributes:'f4$fv$v6' options:'f4$fv$v6' properties:'f4$fv$v6' attributes:'f4$fv$v5' options:'f4$fv$v5' properties:'f4$fv$v5') (or attributes:'f3$fv$v4' options:'f3$fv$v4' properties:'f3$fv$v4') (or attributes:'f2$fv$v3' options:'f2$fv$v3' properties:'f2$fv$v3') (or properties:'f1$fv$v2' properties:'f1$fv$v1') display_amount:[200,1500])")
      assert.equal(result.q, "(or (and 'ein' 'qu' '3' 'ery' 'mit' 'meh' 're' 'ren' 'sil' 'ben' 'und' 'trenn' 'strich' '3') (and (prefix field='item_numbers' 'ein') (prefix field='item_numbers' 'qu') (prefix field='item_numbers' '3') (prefix field='item_numbers' 'ery') (prefix field='item_numbers' 'mit') (prefix field='item_numbers' 'meh') (prefix field='item_numbers' 're') (prefix field='item_numbers' 'ren') (prefix field='item_numbers' 'sil') (prefix field='item_numbers' 'ben') (prefix field='item_numbers' 'und') (prefix field='item_numbers' 'trenn') (prefix field='item_numbers' 'strich') (prefix field='item_numbers' '3')) (term boost=2 'ein qu3ery mit mehReren silben und trennstrich - 3') (prefix 'ein qu3ery mit mehReren silben und trennstrich - 3') (and (prefix field=name 'ein') (prefix field=name 'ery') (prefix field=name 'mit') (prefix field=name 'meh') (prefix field=name 'reren') (prefix field=name 'silben') (prefix field=name 'und') (prefix field=name 'trennstrich')) item_numbers:'ein qu3ery mit mehReren silben und trennstrich - 3')")
    })

    it('should build a complex query 3', () => {
      builder.setPriceRange(200, 1500).setPagination(0, 0).setSort('random').shopLanguage = LANG_DE
      const result = builder.setSearchTerm('ein qu3ery mit mehReren silben und trennstrich').buildSearchQuery(true)

      assert.equal(result['q.parser'], 'structured')
      assert.equal(typeof result.start, 'undefined')
      assert.equal(result.size, 0)
      assert.equal(result.sort, 'random desc')
      assert.ok(result['expr.random'].match(/^sin\(_rand\*\d\d?\d?\)$/), `expr.random is ${result['expr.random']}`)
      assert.equal(result.fq, '(and shop_number:123 display_amount:[200,1500])')
      assert.equal(result.q, "(or (and 'ein' 'qu' '3' 'ery' 'mit' 'meh' 're' 'ren' 'sil' 'ben' 'und' 'trenn' 'strich' '2') (and (prefix field='item_numbers' 'ein') (prefix field='item_numbers' 'qu') (prefix field='item_numbers' '3') (prefix field='item_numbers' 'ery') (prefix field='item_numbers' 'mit') (prefix field='item_numbers' 'meh') (prefix field='item_numbers' 're') (prefix field='item_numbers' 'ren') (prefix field='item_numbers' 'sil') (prefix field='item_numbers' 'ben') (prefix field='item_numbers' 'und') (prefix field='item_numbers' 'trenn') (prefix field='item_numbers' 'strich') (prefix field='item_numbers' '2')) (term boost=2 'ein qu3ery mit mehreren silben und trennstrich 2') (prefix 'ein qu3ery mit mehreren silben und trennstrich 2') (and (prefix field=name 'ein') (prefix field=name 'ery') (prefix field=name 'mit') (prefix field=name 'mehreren') (prefix field=name 'silben') (prefix field=name 'und') (prefix field=name 'trennstrich')) item_numbers:'ein qu3ery mit mehreren silben und trennstrich 2')")
    })

    it('should build a complex query 4', () => {
      const filters = {
        'f1': { values: ['v1', 'v2'], source: 'properties' },
        'f2': { values: 'v3' },
        'f3': 'v4',
        'f4': ['v5', 'v6'],
        'onlyActive': 1,
        'only_discounted': 1
      }
      builder.setFilters(filters).shopLanguage = LANG_DE
      const result = builder.setSearchTerm('').buildSearchQuery()

      assert.equal(result['q.parser'], 'structured')
      assert.equal(typeof result['highlight.name'], 'undefined')
      assert.equal(typeof result['highlight.child_names'], 'undefined')
      assert.equal(typeof result['highlight.attributes_searchable'], 'undefined')

      assert.equal(result.fq, "(and shop_number:123 discount:{1,} (or attributes:'f4$fv$v6' options:'f4$fv$v6' properties:'f4$fv$v6' attributes:'f4$fv$v5' options:'f4$fv$v5' properties:'f4$fv$v5') (or attributes:'f3$fv$v4' options:'f3$fv$v4' properties:'f3$fv$v4') (or attributes:'f2$fv$v3' options:'f2$fv$v3' properties:'f2$fv$v3') (or properties:'f1$fv$v2' properties:'f1$fv$v1'))")
      assert.equal(result.q, 'matchall')
    })

    it('should build a complex query 5', () => {
      const filters = { 'categories': ['a1', 'b2'], 'manufacturer': ['m1', 'm2'] }
      builder.setFilters(filters)
      const result = builder.setSearchTerm('ein qu3ery mit mehReren silben und trennstrich - 3 - ').buildSearchQuery(false, true)

      assert.deepEqual(result['facet.attributes'], { sort: 'bucket', size: 5000 })
      assert.deepEqual(result['facet.options'], { sort: 'bucket', size: 5000 })
      assert.deepEqual(result['facet.properties'], { sort: 'bucket', size: 5000 })
      assert.equal(typeof result['facet.categories'], 'undefined')
      assert.equal(typeof result['facet.manufacturer'], 'undefined')
      assert.deepEqual(result['facet.display_amount'], { sort: 'bucket', size: 5000 })
      assert.equal(result.sort, '_score desc')

      assert.equal(result.fq, "(and shop_number:123 (or manufacturer:'m2' manufacturer:'m1') (or (or (prefix field=categories 'b2=>')(phrase field=categories 'b2')) (or (prefix field=categories 'a1=>')(phrase field=categories 'a1'))))")
      assert.equal(result.q, "(or (and 'ein' 'qu' '3' 'ery' 'mit' 'meh' 'reren' 'silben' 'und' 'trennstrich' '3') (and (prefix field='item_numbers' 'ein') (prefix field='item_numbers' 'qu') (prefix field='item_numbers' '3') (prefix field='item_numbers' 'ery') (prefix field='item_numbers' 'mit') (prefix field='item_numbers' 'meh') (prefix field='item_numbers' 'reren') (prefix field='item_numbers' 'silben') (prefix field='item_numbers' 'und') (prefix field='item_numbers' 'trennstrich') (prefix field='item_numbers' '3')) (term boost=2 'ein qu3ery mit mehReren silben und trennstrich - 3') (prefix 'ein qu3ery mit mehReren silben und trennstrich - 3') (and (prefix field=name 'ein') (prefix field=name 'ery') (prefix field=name 'mit') (prefix field=name 'meh') (prefix field=name 'reren') (prefix field=name 'silben') (prefix field=name 'und') (prefix field=name 'trennstrich')) item_numbers:'ein qu3ery mit mehReren silben und trennstrich - 3')")
    })
  })

  describe('normalizeSearchTerm', () => {
    const tests = [
      ['jh 631 9 rd', 'jh631  9RD', 'en-us'],
      ['jh 6319 rd', 'jh-6319@rd', 'en-us'],
      ['trennstrich', 'Trennstrich', LANG_DE],
      ['trennstrich', 'Trennstrich', 'en-en'],
      ['jd 123 hd dd 345 jd 444', 'jd123hdDd345jd444', LANG_DE],
      ['qu 3 ery', 'qu3ery', LANG_DE]
    ]
    tests.forEach((test) => {
      it(`should normalize "${test[1]}" to "${test[0]}" in lang "${test[2]}"`, () => {
        builder.shopLanguage = test[2]
        assert.equal(builder._normalizeSearchTerm(test[1]), test[0])
      })
    })
  })

  describe('buildSearchTermQuery', () => {
    const tests = [
      ['*', 'en-us', ''],
      ['produkt', 'en-us', "(or 'produkt' (prefix field='item_numbers' 'produkt') (prefix 'produkt') item_numbers:'produkt')"],
      ['Einzelsofas Ecksofas Trennstrich', 'en-us', "(or (and 'einzelsofas' 'ecksofas' 'trennstrich') (and (prefix field='item_numbers' 'einzelsofas') (prefix field='item_numbers' 'ecksofas') (prefix field='item_numbers' 'trennstrich')) (term boost=2 'Einzelsofas Ecksofas Trennstrich') (prefix 'Einzelsofas Ecksofas Trennstrich') (and (prefix field=name 'einzelsofas') (prefix field=name 'ecksofas') (prefix field=name 'trennstrich')) item_numbers:'Einzelsofas Ecksofas Trennstrich')"],
      ['*', LANG_DE, ''],
      ['produkt', LANG_DE, "(or (and 'pro' 'dukt') (and (prefix field='item_numbers' 'pro') (prefix field='item_numbers' 'dukt')) (term boost=2 'produkt') (prefix 'produkt') item_numbers:'produkt')"],
      ['Einzelsofas Ecksofas Trennstrich', LANG_DE, "(or (and 'ein' 'zel' 'so' 'fas' 'eck' 'sofas' 'trenn' 'strich') (and (prefix field='item_numbers' 'ein') (prefix field='item_numbers' 'zel') (prefix field='item_numbers' 'so') (prefix field='item_numbers' 'fas') (prefix field='item_numbers' 'eck') (prefix field='item_numbers' 'sofas') (prefix field='item_numbers' 'trenn') (prefix field='item_numbers' 'strich')) (term boost=2 'Einzelsofas Ecksofas Trennstrich') (prefix 'Einzelsofas Ecksofas Trennstrich') (and (prefix field=name 'einzelsofas') (prefix field=name 'ecksofas') (prefix field=name 'trennstrich')) item_numbers:'Einzelsofas Ecksofas Trennstrich')"]
    ]

    tests.forEach((test) => {
      it(`should build search term for ${test[1]}: ${test[0]}`, (done) => {
        builder.shopLanguage = test[1]
        assert.equal(builder._buildSearchTermQuery(test[0]), test[2])
        done()
      })
    })

    it('should return the correct term for "produkt"', () => {
      const expected = "(or 'produkt' (prefix field='item_numbers' 'produkt') (prefix 'produkt') item_numbers:'produkt')"
      assert.equal(builder._buildSearchTermQuery('produkt'), expected)
    })
  })

  describe('setupQueryParams', () => {
    it('should setup the correct params for an empty string', () => {
      const result = builder._setupQueryParams('')
      assert.equal(result.q, 'matchall')
      assert.equal(result['q.parser'], 'structured')
    })

    it('should setup the correct params for "simple"', () => {
      const result = builder._setupQueryParams('simple')
      assert.equal(result.q, 'simple')
      assert.equal(typeof result['q.parser'], 'undefined')
    })

    it('should setup the correct params for "(and produkt)', () => {
      const result = builder.setPagination(3, 5)._setupQueryParams('(and produkt)')
      assert.equal(result.q, '(and produkt)')
      assert.equal(result.start, 3)
      assert.equal(result.size, 5)
      assert.equal(result.fq, 'shop_number:123')
    })
  })

  describe('buildSearchQueryForPriceFilter', () => {
    const tests = [
      [null, null, ''],
      [200, '', 'display_amount:[200,}'],
      [null, 9900, 'display_amount:{,9900]'],
      [5000, 40000, 'display_amount:[5000,40000]']
    ]

    tests.forEach((test) => {
      it(`should return the correct string for min="${test[0]}" and max="${test[1]}"`, () => {
        const result = builder.setPriceRange(test[0], test[1])._buildSearchQueryForPriceFilter()
        assert.equal(result, test[2])
      })
    })
  })

  describe('buildAndConjunction', () => {
    const tests = [
      [[], ''],
      [[''], ''],
      [['test:123'], 'test:123'],
      [['test:123', 'foo:bar'], '(and test:123 foo:bar)']
    ]
    tests.forEach((test) => {
      it(`should return the correct conjunction for "${JSON.stringify(test[0])}"`, () => {
        const result = builder._buildConjunction(test[0])
        assert.equal(result, test[1])
      })
    })
  })

  describe('formatFilters', () => {
    it('should not reformat a correct filter', () => {
      const filters = { 'Facet Test': { values: ['Value 1', 'Value 2'], source: 'properties' } }
      const result = builder.setFilters(filters).filters
      assert.deepEqual(result, filters)
    })

    it('should reformat a wrong formatted filter', () => {
      const filters = { 'Facet Test': 'Value 1' }
      const expected = { 'Facet Test': { values: ['Value 1'], source: 'Facet Test' } }
      const result = builder.setFilters(filters).filters
      assert.deepEqual(result, expected)
    })

    it('should remove an empty formatted filter', () => {
      const filters = { 'Facet Test': [] }
      const result = builder.setFilters(filters).filters
      assert.deepEqual(result, {})
    })
  })

  describe('buildSearchQueryForFilters', () => {
    const tests = [
      [
        { 'Facet Test': { values: ['Value 1'], source: 'properties' } },
        "properties:'Facet Test$fv$Value 1'"
      ], [
        { 'Facet Test': { values: ['Value 1', 'Value 2'], source: 'properties' } },
        "(or properties:'Facet Test$fv$Value 2' properties:'Facet Test$fv$Value 1')"
      ]
    ]

    tests.forEach((test) => {
      it(`should create the correct query for "${JSON.stringify(test[0])}"`, () => {
        assert.equal(builder.setFilters(test[0])._buildSearchQueryForFilters(), test[1])
      })
    })
  })

  describe('getFilterStringsFromValues', () => {
    const tests = [
      [
        { key: 'attributes', source: 'manufacturer', values: ['vw', 'audi', 'bmw'] },
        ["manufacturer:'bmw'", "manufacturer:'audi'", "manufacturer:'vw'"]
      ], [
        { key: 'categories', source: 'categories', values: ['shoes', 'shirts', 'pants'] },
        [
          "(or (prefix field=categories 'pants=>')(phrase field=categories 'pants'))",
          "(or (prefix field=categories 'shirts=>')(phrase field=categories 'shirts'))",
          "(or (prefix field=categories 'shoes=>')(phrase field=categories 'shoes'))"
        ]
      ], [
        { key: 'attributes', source: 'attributes', values: ['blue', 'green', 'red'] },
        ["attributes:'attributes$fv$red'", "attributes:'attributes$fv$green'", "attributes:'attributes$fv$blue'"]
      ], [
        { key: 'options', source: 'options', values: ['blue', 'green', 'red'] },
        ["options:'options$fv$red'", "options:'options$fv$green'", "options:'options$fv$blue'"]
      ], [
        { key: 'properties', source: 'properties', values: ['blue', 'green', 'red'] },
        ["properties:'properties$fv$red'", "properties:'properties$fv$green'", "properties:'properties$fv$blue'"]
      ], [
        { key: 'properties', source: 'foo', values: ['blue', 'green', 'red'] },
        [
          "attributes:'properties$fv$red'", "options:'properties$fv$red'", "properties:'properties$fv$red'",
          "attributes:'properties$fv$green'", "options:'properties$fv$green'", "properties:'properties$fv$green'",
          "attributes:'properties$fv$blue'", "options:'properties$fv$blue'", "properties:'properties$fv$blue'"
        ]
      ]
    ]

    tests.forEach((test, i) => {
      it(`should create the correct filter strings for test no ${i}`, () => {
        assert.deepEqual(builder._getFilterStringsFromValues(test[0].key, test[0]), test[1])
      })
    })

    describe('Example Cases', () => {
      it('should build the correct string for single category filter', () => {
        builder.addCategoryFilter('someCat')
        const query = builder.buildSearchQuery(false, true)
        assert.deepEqual(query.fq, '(and shop_number:123 (or (prefix field=categories \'someCat=>\')(phrase field=categories \'someCat\')))')
      })
    })
  })

  describe('Full tests', () => {
    it('should build the correct query for filters of a category', () => {
      const expectedQuery = {
        return: 'uid',
        'q.options': {
          fields: [
            'name^2', 'child_names', 'item_numbers', 'tags', 'categories_searchable', 'attributes_searchable',
            'options_searchable', 'properties_searchable', 'manufacturer_searchable', 'name_normalized^0.5'
          ]
        },
        q: 'matchall',
        'q.parser': 'structured',
        fq: '(and shop_number:123 (or (prefix field=categories \'4 - Sortierung/Filter=>\')(phrase field=categories \'4 - Sortierung/Filter\')))',
        size: 0,
        'facet.attributes': { sort: 'bucket', size: 5000 },
        'facet.options': { sort: 'bucket', size: 5000 },
        'facet.properties': { sort: 'bucket', size: 5000 },
        'facet.manufacturer': { sort: 'bucket', size: 5000 },
        'facet.display_amount': { sort: 'bucket', size: 5000 },
        sort: '_score desc'
      }

      const filters = { categories: ['4 - Sortierung/Filter'] }
      builder.setFilters(filters)

      const query = builder.buildSearchQuery(false, true)
      assert.deepEqual(query, expectedQuery)
    })
  })
})

/*
 return: '_no_fields',
 q.options: '{"fields":["name^2', 'child_names', 'item_numbers', 'tags', 'categories_searchable', 'attributes_searchable', 'options_searchable', 'properties_searchable', 'manufacturer_searchable', 'name_normalized^0.5"]}',
 q: 'matchall',
 'q.parser': 'structured',
 fq: '(and shop_id:131 (prefix field=categories '4 – Sortierung/Filter') display_amount:[5200,})',
 size: 20,
 'facet.attributes': '{"sort":"bucket', 'size":5000}',
 'facet.options': '{"sort":"bucket', 'size":5000}',
 'facet.properties': '{"sort":"bucket', 'size":5000}',
 'facet.manufacturer': '{"sort":"bucket', 'size":5000}',
 'facet.display_amount': '{"sort":"bucket', 'size":5000}',
 sort: 'display_amount desc'
 */
