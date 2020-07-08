import express from 'express';
import axios from 'axios';
import * as firebase from 'firebase';
import * as qs from 'qs';
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;
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
  res.send('Login API is running');

});

// Spotify login endpoint
app.post('/login', async (req: any, res: any) => {

  // Get token from Request
  if (req.body.auth_code === undefined) {
    res.status(400);
    res.send('Missing authorization token');
    return;
  }

  const authCode = req.body.auth_code;
  const tokenData = await getTokenFromAuth(authCode);

  const token = tokenData.access_token;

  // Get user data with token
  const userData = await getUser(token);
  console.log(userData);


  // Check if user has presaved before
  const firstPresave = await checkIfFirstSave(userData.id);

  if (!firstPresave) {
    res.status(200).json({
      success: true,
      message: 'User has presaved before'
    });
    return;
  }


  // Store data in Firestore
  await registerPresave(tokenData, userData);

  res.status(200).json({
    success: true,
    message: 'Presave registered'
  });

});

// Start listening on defined port
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));





// Get token and refresh tokens from Spotify with Authorization token
const getTokenFromAuth = async (code: string) => {

  const endpoint = 'https://accounts.spotify.com/api/token';
  const redirectUrl = process.env.REDIRECT_URL || 'http://localhost:4200/callback';

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

};

// Check if the user has presaved
const checkIfFirstSave = async (id: string) => {

  const userDocsSnap = await fb.firestore().collection('presaves').where('user.id', '==', id).get();
  const size = userDocsSnap.size;

  if (size > 0) {
    return false;
  } else {
    return true;
  }

};

// Register presave in Firestore
const registerPresave = async (authData: object, userData: object) => {
  const increment = firebase.firestore.FieldValue.increment(1);
  const docData = {
    authorization: authData,
    user: userData,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    hasSaved: false
  };

  const statsRef = fb.firestore().collection('presaves').doc('--stats--');
  const docRef = fb.firestore().collection('presaves').doc();

  const batch = fb.firestore().batch();
  batch.set(docRef, docData);
  batch.set(statsRef, { saves: increment }, { merge: true });
  return batch.commit();

};
