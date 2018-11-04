class Filter {
  /**
   * @param {string} id
   * @param {string} label
   * @param {string} type
   * @param {string} [source]
   */
  constructor (id, label, type, source) {
    this.id = id
    this.label = label
    this.type = type
    if (source !== undefined) this.source = source
  }

  /**
   * @param {number} min
   * @param {number} max
   * @returns {Filter}
   */
  setRange (min, max) {
    this.minimum = min
    this.maximum = max
    return this
  }

  /**
   * @param {string} id
   * @param {string} label
   * @returns {Filter}
   */
  addValue (id, label) {
    if (!this.values) this.values = []
    this.values.push({id, label})
    return this
  }

  /**
   *
   * @param values
   * @returns {Filter}
   */
  setValues (values) {
    this.values = values
    return this
  }
}

class Value {
  constructor (id, label, hits) {
    this.id = id
    this.label = label
    this.hits = hits
  }

  /**
   * @param {Value[]} values
   */
  static sortValues (values) {
    values.sort((a, b) => {
      const al = a.label.toLowerCase()
      const bl = b.label.toLowerCase()
      if (al > bl) return 1
      if (bl === al) return 0
      return -1
    })
  }
}

module.exports = Filter
module.exports.Value = Value
module.exports.TYPE_RANGE = 'range'
module.exports.TYPE_MULTISELECT = 'multiselect'
