const request = require('request-promise-native')
const defaultHeader = require('../data/defaultHeaders')
const appStartCommand = require('../data/appStartCommand')

const rapidUrl = process.env.RAPID_URL || 'https://sgxs-rapid2-sandbox.shopgate.services/'

const defaultParams = {
  url: rapidUrl,
  method: 'POST',
  headers: defaultHeader,
  json: true
}

class PipelineRequester {
  /**
   * Fire appstart to create device session
   */
  async init () {
    if (this.alreadyInit) return
    this.alreadyInit = true
    const params = {
      ...defaultParams,
      body: appStartCommand
    }
    return request(params)
  }

  async doPipelineRequest (pipelineName, input) {
    const params = {
      ...defaultParams,
      body: {
        vars: {
          'sid': 'intergrationTest'
        },
        ver: '2.0',
        cmds: [
          {
            c: 'pipelineRequest',
            p: {
              'name': pipelineName,
              input
            }
          }
        ]
      },
      resolveWithFullResponse: true
    }
    const result = await request(params)
    let responseData = null
    if (result.body.cmds) {
      responseData = result.body.cmds[0].p
    }
    return { statusCode: result.statusCode, responseData }
  }
}

module.exports = new PipelineRequester()
