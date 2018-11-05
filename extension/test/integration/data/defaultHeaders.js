const appId = process.env.APP_ID || 'shop:30631'
const defaultDeviceId = 'integrationTest'

module.exports = {
  'sg-application-Id': appId,
  'sg-api-codebase': '5.15.0',
  'sg-device-id': defaultDeviceId,
  'sg-device-type': 'android-phone',
  'accept-version': '~1'
}
