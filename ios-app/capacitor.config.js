// Capacitor settings for the iOS app. The bundle id comes from the BUNDLE_ID variable of the GitHub workflow.
module.exports = {
  appId: process.env.BUNDLE_ID || 'com.doabno.app',
  appName: 'DOABNO',
  webDir: 'www',                       // filled with the built /app/ pages by the workflow
  backgroundColor: '#0E2A47',
  ios: { contentInset: 'always', limitsNavigationsToAppBoundDomains: false },
  server: { iosScheme: 'capacitor', allowNavigation: ['*.supabase.co'] }
};
