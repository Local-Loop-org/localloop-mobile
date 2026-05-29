const fs = require('fs');

const appJson = require('./app.json');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON || './google-services.json';

const android = { ...appJson.expo.android };

if (process.env.GOOGLE_SERVICES_JSON || fs.existsSync(googleServicesFile)) {
  android.googleServicesFile = googleServicesFile;
}

module.exports = {
  ...appJson.expo,
  android,
};
