const fs = require('fs');
const path = require('path');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_FILE || './google-services.json';
const hasGoogleServicesFile = fs.existsSync(
  path.resolve(__dirname, googleServicesFile),
);

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(hasGoogleServicesFile ? { googleServicesFile } : {}),
  },
});
