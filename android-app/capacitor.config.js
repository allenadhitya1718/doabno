// Capacitor settings for the Android app. The app id comes from the BUNDLE_ID variable of the GitHub workflow (the same id as the iOS app).
module.exports = {
  appId: process.env.BUNDLE_ID || 'com.doabno.app',
  appName: 'DOABNO',
  webDir: 'www',                       // filled with the built /app/ pages by the workflow
  backgroundColor: '#0E2A47',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https', allowNavigation: ['*.supabase.co'] },
  // The page moves bottom sheets above the keyboard itself (it gets the height from this plugin), so the window is not resized.
  plugins: { Keyboard: { resize: 'none' } }
};
