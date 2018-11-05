const step = require('../../../steps/getSearchSuggestions')
const assert = require('assert')
const nock = require('nock')
const request = require('request')

describe('getSearchSuggestions', () => {
  let context, input

  beforeEach(() => {
    context = {
      config: {
        languageId: 'de-de',
        cloudsearchUrls: {
          de: 'http://cloudsearch.de/search',
          en: 'http://cloudsearch.en/search'
        }
      },
      meta: { appId: 'shop_12345' },
      tracedRequest: () => request,
      log: { debug: () => {} }
    }
    input = { searchPhrase: 'some😅   spAced👌' } // multi-whitespace and emoji should be removed

    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.enableNetConnect()
  })

  it('should build a request and parse the response', (done) => {
    const hits = [
      {id: '1', highlights: {name: '', child_names: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk'}},
      {id: '2', highlights: {name: 'some$start$,high$end$foofoofoo something like that$next$foooLuLuLuLu', child_names: ''}}, // , should be removed
      {id: '3', highlights: {name: 'some$start$+high$end$foofoofoo+ something like  that$next$foooLuLuLuLu', child_names: ''}}, // + should be removed
      {id: '4', highlights: {name: 'some$start$high$end$fooFoofoo something like that$next$foooLuLuLuLu', child_names: ''}}, // same but different case
      {id: '5', highlights: {name: 'some$start$high$end$fooFoofoo something like that$next$foooLuLuLuLu', child_names: ''}}, // 3 times, so this is the correct case
      {id: '6', highlights: {name: 'some$start$high$end$fooFoofoo something like that$next$foooLuLuLuLu', child_names: ''}}, // should be sorted to first position
      {id: '7', highlights: {name: '', child_names: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk'}},
      {id: '8', highlights: {name: '', child_names: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk'}},
      {id: '9', highlights: {name: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk', child_names: ''}},
      {id: 'a', highlights: {name: 'foooo$start$-hithithithit-$end$', child_names: ''}}, // only match[1], hyphen at end should be removed
      {id: 'b', highlights: {name: 'foooo$start$hithit$end$', child_names: 'foooo$start$hithit$end$'}} // hit to short, should be removed
    ]
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(qs => {
        assert.deepEqual(qs, {
          'q.parser': 'structured',
          'q.options': '{"fields":["name","child_names"]}',
          size: '100',
          'highlight.name': '{"format":"text","pre_tag":"$start$","post_tag":"$end$"}',
          'highlight.child_names': '{"format":"text","pre_tag":"$start$","post_tag":"$end$"}',
          return: 'name,child_names',
          q: '(and (or \'some\' (prefix \'some\')) (or \'spaced\' (prefix \'spaced\')))',
          fq: 'shop_number:12345'
        })
        return true
      })
      .reply(200, {hits: {hit: hits}})

    step(context, input, (err, result) => {
      assert.ifError(err)
      api.done()

      assert.deepEqual(result, {suggestions: [
        'highfooFoofoo',
        'highfooFoofoo something',
        'highfooFoofoo something like',
        'xxxxmmmmmmmm',
        'xxxxmmmmmmmm kkkkkk',
        '-hithithithit'
      ]})
      done()
    })
  })

  it('should return an empty array if there where no hits', (done) => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, {hits: {hit: []}})

    step(context, input, (err, result) => {
      api.done()
      assert.ifError(err)
      assert.deepEqual(result, {suggestions: []})
      done()
    })
  })

  it('should return an empty array if there where no hit array', (done) => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, {hits: {}})

    step(context, input, (err, result) => {
      api.done()
      assert.ifError(err)
      assert.deepEqual(result, {suggestions: []})
      done()
    })
  })

  it('should return an empty array if there where no hits object', (done) => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, {})

    step(context, input, (err, result) => {
      api.done()
      assert.ifError(err)
      assert.deepEqual(result, {suggestions: []})
      done()
    })
  })

  it('should return an empty array if there where no json aswer', (done) => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, 'fooo{')

    step(context, input, (err, result) => {
      api.done()
      assert.ifError(err)
      assert.deepEqual(result, {suggestions: []})
      done()
    })
  })

  it('should throw an error if statusCode is != 200 and return rawBody if its no valid json', (done) => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(500, 'something{')

    step(context, input, (err) => {
      api.done()
      assert.ok(err)
      assert.equal(err.message, 'something{')
      done()
    })
  })

  it('should return an empty array if searchPhrase.length < 2', (done) => {
    input.searchPhrase = 'a'
    step(context, input, (err, res) => {
      assert.ifError(err)
      assert.deepEqual(res, {suggestions: []})
      done()
    })
  })
})
