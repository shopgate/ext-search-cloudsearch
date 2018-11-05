const appId = process.env.APP_ID || 'shop:30631'

module.exports = {
  'vars': {
    'sid': 'intergrationTest'
  },
  'ver': '2.0',
  'cmds': [
    {
      'c': 'appStart',
      'p': {
        'apiKey': 'testTesttest',
        'appIdentifier': appId,
        'appVersion': '5.15.0',
        'codebase': '5.15.0',
        'device': {
          'advertisingId': '2a460a58-73af-42c2-9f2d-74002b272dd4',
          'cameras': [
            {
              'light': true,
              'resolutionX': 4048,
              'resolutionY': 3044,
              'type': 'back',
              'video': true
            },
            {
              'light': false,
              'resolutionX': 3280,
              'resolutionY': 2464,
              'type': 'front',
              'video': true
            }
          ],
          'carrier': 'Telekom.de',
          'locale': 'de',
          'model': 'Pixel',
          'os': {
            'apiLevel': '25',
            'platform': 'android',
            'ver': '7.1.1'
          },
          'screen': {
            'height': 1794,
            'scale': 2.625,
            'width': 1080
          },
          'type': 'phone'
        },
        'isDevelopmentApp': true,
        'supportedAnalyticsServices': ['facebook', 'appsFlyer', 'google'],
        'supportedIdentityServices': ['facebook']
      }
    }
  ],
  'serial': 1
}
