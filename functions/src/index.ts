import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const axios = require('axios');
const qs = require('qs');

// Retrieve and store Spotify tokens and subsequent user data with Authentication code
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

    // Get token from Spotify
    const tokenRes = await axios.post(endpoint, requestBody);

    // Extract token
    const authData = {
      token: tokenRes.data.access_token,
      expiresIn: parseInt(tokenRes.data.expires_in),
      refreshToken: tokenRes.data.refresh_token,
    }

    // Get user data with token
    const userData = await getUserData(authData.token);

    // Create data for stored document in Firestore
    const docData = {
      ...authData,
      user: userData,
      timestamp: admin.firestore.Timestamp.now()
    };

    // Create references to the --stats-- document and a new document
    const statsRef = admin.firestore().collection('presaves').doc('--stats--');
    const docRef = admin.firestore().collection('presaves').doc();

    const batch = admin.firestore().batch();
    batch.set(docRef, docData);
    batch.set(statsRef, { saves: increment }, { merge: true });
    await batch.commit();

    return 'sucess';

  } catch (error) {
    console.error(error);
    return 'error'
  }

});

// Follow artist when a new Token document is added to Firestore
export const followOnCreate = functions.firestore.document('presaves/{presaveId}').onCreate( async (snap, context) => {

  const data = snap.data();
  const token = data.token;

  const artistFollowed = await followArtist(token);
  console.log(artistFollowed);

  return followArtist;

});


// Retrieve user data with Token
const getUserData = async (token: string) => {

  const endpoint = 'https://api.spotify.com/v1/me';

  try {
    const userData = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return userData.data;
  } catch (error) {
    return 'Failed to retrieve user data';
  }

};

// Follow artist with Token
const followArtist = async (token: string) => {

  const artistId = '0u18Cq5stIQLUoIaULzDmA';
  const endpoint = `https://api.spotify.com/v1/me/following?type=artist`;

  const followData = {
    ids: [
      artistId
    ]
  }

  try {
    const followRes = await axios.put(endpoint, followData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (followRes.status !== 204) {
      throw new Error(`Unexpected follow response status: ${followRes.status}`);
    }

    return 'Artist followed successfully';

  } catch (error) {
    console.log('Following artist failed');
    console.error(error);
    return 'Failed to follow artist';
  }

}
