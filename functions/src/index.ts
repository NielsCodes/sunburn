import { Ipresave } from './models';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const axios = require('axios');
const qs = require('qs');

// const redirectURL = 'http://localhost:4200/callback';
const redirectURL = 'https://presave-app.web.app/callback';

// Get credentials from environment variables
const clientID = functions.config().spotify.id;
const clientSecret = functions.config().spotify.secret;

const credentials = `${clientID}:${clientSecret}`;
const encoded = Buffer.from(credentials).toString('base64');


// Follow artist when a new Token document is added to Firestore
export const followOnCreate = functions.firestore.document('presaves/{presaveId}').onCreate( async (snap, context) => {

  const data = snap.data();
  const token = data.token;

  const artistFollowed = await followArtist(token);
  console.log(artistFollowed);

  return followArtist;

});


// Change save count when presave is removed
export const decrementSaveOnDelete = functions.firestore.document('presaves/{presaveId}').onDelete( async (snap, context) => {

  const id = snap.id;

  // Return if removed document is stats doc itself
  if (id === '--stats--') {
    return;
  }

  const statsRef = admin.firestore().collection('presaves').doc('--stats--');
  const decrement = admin.firestore.FieldValue.increment(-1);

  await statsRef.set({
    saves: decrement,
    spotify: decrement
  }, { merge: true });

  return;

});


// Change save count when Messenger presave is removed
export const decrementSaveOnMessengerDelete = functions.firestore.document('messengerSaves/{presaveId}').onDelete( async (snap, context) => {

  const statsRef = admin.firestore().collection('presaves').doc('--stats--');
  const decrement = admin.firestore.FieldValue.increment(-1);

  await statsRef.set({
    saves: decrement,
    messenger: decrement
  }, { merge: true });

  return;

});

// Change save count when Apple presave is removed
export const decrementSaveOnAppleDelete = functions.firestore.document('applePresaves/{presaveId}').onDelete( async (snap, context) => {

  const statsRef = admin.firestore().collection('presaves').doc('--stats--');
  const decrement = admin.firestore.FieldValue.increment(-1);

  await statsRef.set({
    saves: decrement,
    apple: decrement
  }, { merge: true });

  return;

});

// Update video link from presave count on stat update
export const parseSaveCount = functions.firestore.document('presaves/{docId}').onUpdate( async (change, context) => {

  const docID = change.after.id;
  if (docID !== '--stats--') {
    console.log('Not stats doc');
    return;
  }

  const newSaves = change.after.get('saves');
  const configRef = admin.firestore().collection('config').doc('video');

  let videoURL: string = '';
  let mobileURL: string = '';

  // TODO: change mobile URLS to 9x16

  // STAGE 1
  if (newSaves < 100) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F01.mp4?alt=media&token=330d934e-6920-4c48-bafb-c712e9ccd3d1';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F01.mp4?alt=media&token=330d934e-6920-4c48-bafb-c712e9ccd3d1';
  }

  // STAGE 2
  if (newSaves >= 100 && newSaves < 200) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F02.mp4?alt=media&token=05214845-9992-40f4-a600-e984f5aa2074';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F02.mp4?alt=media&token=05214845-9992-40f4-a600-e984f5aa2074';
  }

  // STAGE 3
  if (newSaves >= 200 && newSaves < 300) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F03.mp4?alt=media&token=840b6676-7369-466c-9ee7-686e8fc38203';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F03.mp4?alt=media&token=840b6676-7369-466c-9ee7-686e8fc38203';
  }

  // STAGE 4
  if (newSaves >= 300 && newSaves < 400) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F04.mp4?alt=media&token=9f25f5cd-211e-4c85-81a1-17a37e9cf738';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F04.mp4?alt=media&token=9f25f5cd-211e-4c85-81a1-17a37e9cf738';
  }

  // STAGE 5
  if (newSaves >= 400 && newSaves < 500) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F05.mp4?alt=media&token=0fb24520-364f-41f4-bfb0-aec68b7ceee3';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F05.mp4?alt=media&token=0fb24520-364f-41f4-bfb0-aec68b7ceee3';
  }

  // STAGE 6
  if (newSaves >= 500 && newSaves < 600) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F06.mp4?alt=media&token=754e37ab-de2d-4870-9d12-624f561e16df';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F06.mp4?alt=media&token=754e37ab-de2d-4870-9d12-624f561e16df';
  }

  // STAGE 7
  if (newSaves >= 600 && newSaves < 700) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F07.mp4?alt=media&token=ea999002-df03-4f82-87ee-8dd64222fe3b';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F07.mp4?alt=media&token=ea999002-df03-4f82-87ee-8dd64222fe3b';
  }

  // STAGE 8
  if (newSaves >= 700 && newSaves < 800) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F08.mp4?alt=media&token=e93fafa9-3224-40d9-ba9f-8fd7868adcdd';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F08.mp4?alt=media&token=e93fafa9-3224-40d9-ba9f-8fd7868adcdd';
  }

  // STAGE 9
  if (newSaves >= 800 && newSaves < 900) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F09.mp4?alt=media&token=b9e088d2-c591-4727-b1ab-8e9e32e10a37';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F09.mp4?alt=media&token=b9e088d2-c591-4727-b1ab-8e9e32e10a37';
  }

  // STAGE 10
  if (newSaves >= 900) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F10.mp4?alt=media&token=fd5358e6-e7b8-42c7-b7db-9018aa5b34fc';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F10.mp4?alt=media&token=fd5358e6-e7b8-42c7-b7db-9018aa5b34fc';
  }

  // TODO: change share menu text after hitting 1000

  await configRef.set({
    source: videoURL,
    mobileSource: mobileURL
   });

  return;

})


// export const saveTrackToLibrary = functions.pubsub.schedule('0 * * * *').onRun( async (context) => {

//   // Get all presaves from database
//   const presaveSnapshot = await admin.firestore().collection('presaves').get();
//   const presaves: Ipresave[] = presaveSnapshot.docs.filter(doc => doc.id !== '--stats--').map(doc => {
//     const docData = doc.data();
//     const docContent = {
//       token: docData.token,
//       expiresIn: docData.expiresIn,
//       refreshToken: docData.refreshToken,
//       user: docData.user,
//       timestamp: docData.timestamp,
//       hasSaved: docData.hasSaved
//     }

//     return  {
//       id: doc.id,
//       ...docContent,
//     }

//   }).filter(doc => doc.hasSaved !== true);

//   // Get new tokens with the refresh token

//     try {

//       const currentDocRef = admin.firestore().collection('presaves').doc(presave.id);

//       const token = await getTokenFromRefreshToken(presave.refreshToken);

//       await currentDocRef.set({ token }, { merge: true });

//       const trySave = await saveTrack(token);

//       if (trySave.success) {
//         await currentDocRef.set({ hasSaved: true }, { merge: true });
//       }

//     } catch (error) {

//       console.error(error);

//     }

//   }


// });



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

// Get new token with Refresh Token
const getTokenFromRefreshToken = async (refreshToken: string) => {

  const endpoint = 'https://accounts.spotify.com/api/token';

  const requestBody = qs.stringify({
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken,
    'redirect_uri': redirectURL
  });

  try {
    const tokenRes = await axios.post(endpoint, requestBody, {
      headers: {
        Authorization: `Basic ${encoded}`
      }
    });

    return tokenRes.data.access_token

  } catch (error) {
    return error;
  }

}

const saveTrack = async (token: string) => {

  const endpoint = 'https://api.spotify.com/v1/me/tracks';

  const saveData = {
    ids: ['7s4oDm9CSAzYnsIaMy4FaF']
  }

  try {
    const saveRes = await axios.put(endpoint, saveData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    return { success: true };

  } catch (error) {
    return { success: false, error }
  }

}
