const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 8080;
const firebase = require('firebase');
const qs = require('qs');
const cors = require('cors');
const fb = firebase.initializeApp({
  apiKey: 'AIzaSyDCF3Bl0KvlDjjsnK5i6TLa9NZjCetgBPE',
  authDomain: 'presave-app.firebaseapp.com',
  databaseURL: 'https://presave-app.firebaseio.com',
  projectId: 'presave-app',
  storageBucket: 'presave-app.appspot.com',
  messagingSenderId: '565477002562',
  appId: '1:565477002562:web:6bb7de375ed1a9e1438cdb'
});

if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

// Use JSON parser
app.use(express.json());

app.use(cors());

// Status endpoint
app.get('/', (req: any, res: any) => {

  res.status(200);
  res.send(process.env.FOO);

});

// Spotify login endpoint
app.post('/login', async (req: any, res: any) => {

  // Get token from Request
  if (req.body.auth === undefined) {
    res.status(400);
    res.send('Missing authorization token');
    return;
  }

  const auth = req.body.auth;
  const tokenData = await getTokenFromAuth(auth);

  const token = tokenData.access_token;

  // Get user data with token
  const userData = await getUser(token);
  console.log(userData);


  // Check if user has presaved before

  // Store data in Firestore

  res.json(tokenData);

});

// Start listening on defined port
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));





// Get token and refresh tokens from Spotify with Authorization token
const getTokenFromAuth = async (code: string) => {

  const endpoint = 'https://accounts.spotify.com/api/token';
  // const redirectUrl = 'https://presave-app.web.app/callback';
  const redirectUrl = 'http://localhost:4200/callback';

  // Encode API credentials
  const credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
  const authorization = Buffer.from(credentials).toString('base64');

  // Create request body
  const requestBody = qs.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUrl
  });

  // Try calling the Spotify API
  try {

    const tokenRes = await axios.post(endpoint, requestBody, {
      headers: {
        Authorization: `Basic ${authorization}`
      }
    });

    return tokenRes.data;

  } catch (error) {
    console.error(error);
    throw new Error(error);
  }

};

// Get user data with token
const getUser = async (token: string) => {

  const endpoint = 'https://api.spotify.com/v1/me';

  try {

    const userRes = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return userRes.data;

  } catch (error) {
    console.error(error);
    throw new Error(error);
  }

}
