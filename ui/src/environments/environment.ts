export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyBMr0tMR-32Ml53VDIhwzzdYtCHnxfospk',
    authDomain: 'presave-app-dev.firebaseapp.com',
    databaseURL: 'https://presave-app-dev.firebaseio.com',
    projectId: 'presave-app-dev',
    storageBucket: 'presave-app-dev.appspot.com',
    messagingSenderId: '142585143182',
    appId: '1:142585143182:web:869829d752cdc4b525cedf',
    measurementId: 'G-60G7PF9HYR'
  },
  /** API endpoint for authentication purposes */
  endpoint: 'http://localhost:8080',
  /** Redirect URL for Spotify authentication */
  redirect: 'http://localhost:4200/callback'
};
