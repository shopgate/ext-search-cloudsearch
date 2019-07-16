const Filter = require('../../../cloudsearch/Filter')
const assert = require('assert')

describe('cloudsearch/Filter', function () {
  it('should init filter', () => {
    const filter = new Filter('id', 'label', 'type', 'source')
    assert.deepStrictEqual(filter.id, 'id')
    assert.deepStrictEqual(filter.label, 'label')
    assert.deepStrictEqual(filter.type, 'type')
    assert.deepStrictEqual(filter.source, 'source')
  })

  it('should set the range', () => {
    const filter = new Filter('id', 'label', 'type', 'source')
    filter.setRange(1, 100)
    assert.deepStrictEqual(filter.minimum, 1)
    assert.deepStrictEqual(filter.maximum, 100)
  })

  it('should add values', () => {
    const filter = new Filter('id', 'label', 'type', 'source')
    filter.addValue('id1', 'label1')
    assert.deepStrictEqual(filter.values, [{ id: 'id1', label: 'label1' }])
    filter.addValue('id2', 'label2')
    assert.deepStrictEqual(filter.values, [
      { id: 'id1', label: 'label1' },
      { id: 'id2', label: 'label2' }
    ])
  })
})

describe('cloudsearch/Filter/Value', function () {
  it('should sort the values', () => {
    const values = [{ label: 'a' }, { label: 'x' }, { label: 'f' }, { label: 'y' }, { label: 'd' }]
    Filter.Value.sortValues(values)
    assert.deepStrictEqual(values, [{ label: 'a' }, { label: 'd' }, { label: 'f' }, { label: 'x' }, { label: 'y' }])
  })
})
