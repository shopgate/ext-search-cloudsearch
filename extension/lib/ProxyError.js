class ProxyError extends Error {
  constructor (statusCode, errObj, input) {
    super()
    Object.assign(this, { statusCode }, errObj)
    delete this.stack
    this.data = {
      bigAPI: {
        service: input.service,
        path: input.path,
        method: input.method
      }
    }
  }

  toJSON () {
    return this
  }
}

module.exports = ProxyError
