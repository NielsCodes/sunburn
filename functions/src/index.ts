import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const axios = require('axios');
const qs = require('qs');

export const spotifyLogin = functions.https.onCall(async (data, context) =>{

  // Get authorization code from function params
  const code = data.code;

  // API setup
  const endpoint = 'https://accounts.spotify.com/api/token';
  const redirectURL = 'http://localhost:4200/callback';

  // Get credentials from environment variables
  const clientID = functions.config().spotify.id;
  const clientSecret = functions.config().spotify.secret;

  const increment = admin.firestore.FieldValue.increment(1);

  // Required request data
  // TODO: Pass client data as Header with Base64 encoding
  const requestBody = qs.stringify({
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': redirectURL,
    'client_id': clientID,
    'client_secret': clientSecret
  });

  // Try calling the Spotify API
  try {

    const tokenRes = await axios.post(endpoint, requestBody);

    // Get returned data
    const tokenData = {
      token: tokenRes.data.access_token,
      expiresIn: parseInt(tokenRes.data.expires_in),
      refreshToken: tokenRes.data.refresh_token,
      timestamp: admin.firestore.Timestamp.now()
    };

    // Create references to the --stats-- document and a new odcument
    const statsRef = admin.firestore().collection('presaves').doc('--stats--');
    const docRef = admin.firestore().collection('presaves').doc();

    const batch = admin.firestore().batch();
    batch.set(docRef, tokenData);
    batch.set(statsRef, { saves: increment }, { merge: true });
    await batch.commit();

    // const userRes

    return 'foobar';

  } catch (error) {
    return 'error'
  }


});

