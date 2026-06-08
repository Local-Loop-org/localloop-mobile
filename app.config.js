const fs = require('fs');

const appJson = require('./app.json');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON || './google-services.json';

const android = { ...appJson.expo.android };

if (process.env.GOOGLE_SERVICES_JSON || fs.existsSync(googleServicesFile)) {
  android.googleServicesFile = googleServicesFile;
}

// react-native-maps uses Google Maps on Android (needs an API key) and Apple
// Maps on iOS (no key). The key is injected from the environment so the secret
// never lands in source control; it is consumed at `expo prebuild`/build time.
// Set GOOGLE_MAPS_API_KEY in .env (see .env.example).
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

if (googleMapsApiKey) {
  android.config = {
    ...android.config,
    googleMaps: { apiKey: googleMapsApiKey },
  };
}

module.exports = {
  ...appJson.expo,
  android,
};
