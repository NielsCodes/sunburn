import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const axios = require('axios');

// Get credentials from environment variables
const clientID = functions.config().spotify.id;
const clientSecret = functions.config().spotify.secret;

const credentials = `${clientID}:${clientSecret}`;
const encoded = Buffer.from(credentials).toString('base64');

const statsRef = admin.firestore().collection('config').doc('--stats--');
const decrement = admin.firestore.FieldValue.increment(-1);

// Follow artist when a new Token document is added to Firestore
export const followOnCreate = functions.firestore.document('spotifyPresaves/{presaveId}').onCreate( async (snap, context) => {

  const data = snap.data();
  const token = data.token;

  const artistFollowed = await followArtist(token);
  console.log(artistFollowed);

  return followArtist;

});


// Change save count when presave is removed
export const decrementSaveOnSpotifyDelete = functions.firestore.document('spotifyPresaves/{presaveId}').onDelete( async (snap, context) => {

  await statsRef.set({
    saves: decrement,
    spotify: decrement
  }, { merge: true });

  return;

});


// Change save count when Messenger presave is removed
export const decrementSaveOnMessengerDelete = functions.firestore.document('messengerSaves/{presaveId}').onDelete( async (snap, context) => {

  await statsRef.set({
    saves: decrement,
    messenger: decrement
  }, { merge: true });

  return;

});

// Change save count when Apple presave is removed
export const decrementSaveOnAppleDelete = functions.firestore.document('applePresaves/{presaveId}').onDelete( async (snap, context) => {

  await statsRef.set({
    saves: decrement,
    apple: decrement
  }, { merge: true });

  return;

});


/**
 * Follow artist on Spotify
 * @param token Spotify bearer token
 */
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

