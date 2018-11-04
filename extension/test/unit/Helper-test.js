const Helper = require('../../Helper')
const assert = require('assert')
const sinon = require('sinon')

describe('Helper', function () {
  describe('extract', () => {
    it('should extract data', () => {
      const input = [{id: 1}, {id: 2}, {foo: 'bar'}, {id: 3}]
      const expected = [3, 2, 1]
      assert.deepEqual(Helper.extract(input, 'id'), expected)
    })
  })

  describe('addcslashes', () => {
    // no chance to stop eslint from crashing here, so this has to stay red for the sake of a complete testsuite
    const tests = [
      ['foo[ ]', 'A..z', '\\f\\o\\o\\[ \\]'],
      ["zoo['.']", 'z..A', "\\zoo['\\.']"],
      ["@a\u0000\u0010\u00A9", "\0..\37!@\177..\377", '\\@a\\000\\020\\302\\251'],
      ["\u0020\u007E", "\40..\175", '\\ ~'],
      ["\r\u0007\n", '\0..\37', "\\r\\a\\n"],
      ["\r\u0007\n", '\0', "\r\u0007\n"]
    ]

    tests.forEach((test, no) => {
      it(`should add cslashes for test no ${no}`, () => {
        assert.equal(Helper.addcslashes(test[0], test[1]), test[2])
      })
    })
  })

  describe('mapFiltersToQueryBuiler', () => {
    it('should map the filter to the query builder', () => {
      let queryBuilder = {
        setPriceRange: sinon.stub(),
        setFilters: sinon.stub()
      }
      const inputFilters = {
        'display_amount': {
          minimum: 1,
          maximum: 10
        },
        filter2: 'someValues'
      }

      queryBuilder = Helper.mapFiltersToQueryBuiler(inputFilters, queryBuilder)
      assert.deepStrictEqual(queryBuilder.setPriceRange.getCall(0).args, [1, 10])
      assert.deepStrictEqual(
        queryBuilder.setFilters.getCall(0).args,
        [{ filter2: 'someValues' }]
      )
    })
  })
})
