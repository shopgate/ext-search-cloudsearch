const step = require('../../../steps/getSearchSuggestions')
const assert = require('assert')
const nock = require('nock')
const request = require('request-promise-native')

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

  it('should build a request and parse the response', async () => {
    const hits = [
      { id: '1', highlights: { name: '', child_names: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk' } },
      { id: '2', highlights: { name: 'some$start$,high$end$foofoofoo something like that$next$foooLuLuLuLu', child_names: '' } }, // , should be removed
      { id: '3', highlights: { name: 'some$start$+high$end$foofoofoo+ something like  that$next$foooLuLuLuLu', child_names: '' } }, // + should be removed
      { id: '4', highlights: { name: 'some$start$high$end$fooFoofoo something like that$next$foooLuLuLuLu', child_names: '' } }, // same but different case
      { id: '5', highlights: { name: 'some$start$high$end$fooFoofoo something like that$next$foooLuLuLuLu', child_names: '' } }, // 3 times, so this is the correct case
      { id: '6', highlights: { name: 'some$start$high$end$fooFoofoo something like that$next$foooLuLuLuLu', child_names: '' } }, // should be sorted to first position
      { id: '7', highlights: { name: '', child_names: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk' } },
      { id: '8', highlights: { name: '', child_names: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk' } },
      { id: '9', highlights: { name: 'fooooooooooooooo$next$ barararar$start$xxxx$end$mmmmmmmm kkkkkk', child_names: '' } },
      { id: 'a', highlights: { name: 'foooo$start$-hithithithit-$end$', child_names: '' } }, // only match[1], hyphen at end should be removed
      { id: 'b', highlights: { name: 'foooo$start$hithit$end$', child_names: 'foooo$start$hithit$end$' } } // hit to short, should be removed
    ]
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(qs => {
        assert.deepStrictEqual(qs, {
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
      .reply(200, { hits: { hit: hits } })

    const result = await step(context, input)
    api.done()

    assert.deepStrictEqual(result, { suggestions: [
      'highfooFoofoo',
      'highfooFoofoo something',
      'highfooFoofoo something like',
      'xxxxmmmmmmmm',
      'xxxxmmmmmmmm kkkkkk',
      '-hithithithit'
    ] })
  })

  it('should return an empty array if there where no hits', async () => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, { hits: { hit: [] } })

    const result = await step(context, input)
    api.done()
    assert.deepStrictEqual(result, { suggestions: [] })
  })

  it('should return an empty array if there where no hit array', async () => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, { hits: {} })

    const result = await step(context, input)
    api.done()
    assert.deepStrictEqual(result, { suggestions: [] })
  })

  it('should return an empty array if there where no hits object', async () => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, {})

    const result = await step(context, input)
    api.done()
    assert.deepStrictEqual(result, { suggestions: [] })
  })

  it('should return an empty array if there where no json aswer', async () => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(200, 'fooo{')

    const result = await step(context, input)
    api.done()
    assert.deepStrictEqual(result, { suggestions: [] })
  })

  it('should throw an error if statusCode is != 200 and return rawBody if its no valid json', async () => {
    const api = nock('http://cloudsearch.de')
      .get('/search')
      .query(() => true)
      .reply(500, 'something{')

    try {
      await step(context, input)
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.message, '500 - "something{"')
    } finally {
      api.done()
    }
  })

  it('should return an empty array if searchPhrase.length < 2', async () => {
    input.searchPhrase = 'a'
    const res = await step(context, input)
    assert.deepStrictEqual(res, { suggestions: [] })
  })
})
