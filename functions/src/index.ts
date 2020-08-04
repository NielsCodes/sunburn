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

  const goal = 1000; // MUST be divisible by 10
  const step = goal / 10;

  const docID = change.after.id;
  if (docID !== '--stats--') {
    console.log('Not stats doc');
    return;
  }

  const newSaves = change.after.get('saves');
  const configRef = admin.firestore().collection('config').doc('video');
  const msgRef = admin.firestore().collection('config').doc('message');

  let videoURL: string = '';
  let mobileURL: string = '';

  let endTitle = 'Almost there...';
  let endMessage = 'Share this with your friends to reveal more!';


  // STAGE 1
  if (newSaves < step) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F01.mp4?alt=media&token=89e443c0-7ab9-469f-8d59-7ffa7dd3fd2d';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F01.mp4?alt=media&token=6e6f65aa-77c7-4d79-aa65-e99ff30d6d09';
  }

  // STAGE 2
  if (newSaves >= step && newSaves < (step * 2)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F02.mp4?alt=media&token=4caab367-54f2-4479-97de-631f4c9e76c0';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F02.mp4?alt=media&token=152230cf-36e8-465f-94ff-2df9f87af0b6';
  }

  // STAGE 3
  if (newSaves >= (step * 2) && newSaves < (step * 3)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F03.mp4?alt=media&token=211d7a93-cb69-4b9a-bfeb-c8b7cdd20f22';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F03.mp4?alt=media&token=cd15d07d-d05d-4551-9e11-e66c5c365049';
  }

  // STAGE 4
  if (newSaves >= (step * 3) && newSaves < (step * 4)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F04.mp4?alt=media&token=d4aaf151-ae4f-44b1-a8e7-ca89b9ea3230';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F04.mp4?alt=media&token=39a0be8f-02b8-4ccf-84d0-97424f83f301';
  }

  // STAGE 5
  if (newSaves >= (step * 4) && newSaves < (step * 5)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F05.mp4?alt=media&token=fc1aac2d-b51b-4098-83dd-757eb024027b';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F05.mp4?alt=media&token=4515717e-5ecd-4ab9-b75e-bf75711dcac2';
  }

  // STAGE 6
  if (newSaves >= (step * 5) && newSaves < (step * 6)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F06.mp4?alt=media&token=0af35e38-2762-44cf-9d3f-5df1c125931c';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F06.mp4?alt=media&token=8c648e13-c306-4b92-b002-36dff8d92469';
  }

  // STAGE 7
  if (newSaves >= (step * 6) && newSaves < (step * 7)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F07.mp4?alt=media&token=ce85b5e3-0850-49e9-8e3d-c6cba154e0ca';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F07.mp4?alt=media&token=824c1c99-4102-48cb-ad25-98c137739349';
  }

  // STAGE 8
  if (newSaves >= (step * 7) && newSaves < (step * 8)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F08.mp4?alt=media&token=71ab9acf-9dba-4537-aaab-0d3ef4bfd02b';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F08.mp4?alt=media&token=8c09f16d-6a62-441a-bd35-9d60bfd2cb1b';
  }

  // STAGE 9
  if (newSaves >= (step * 8) && newSaves < (step * 9)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F09.mp4?alt=media&token=76817246-4f92-4529-9a1b-4a334361a367';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F09.mp4?alt=media&token=7541a4f7-c619-45af-9470-59869312f73d';
  }

  // STAGE 10
  if (newSaves >= (step * 9)) {
    videoURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/16x9%2F10.mp4?alt=media&token=bd29f185-0b5f-4d7b-b507-32095a56fbbe';
    mobileURL = 'https://firebasestorage.googleapis.com/v0/b/presave-app.appspot.com/o/9x16%2F10.mp4?alt=media&token=bd010aac-8f64-47d0-be3c-75fa96f470cf';
  }

  if (newSaves >= goal) {
    endTitle = 'Congratulations!';
    endMessage = `'Open Blinds' will be out on August 21`;
  }

  await configRef.set({
    source: videoURL,
    mobileSource: mobileURL
   });

   await msgRef.set({
    title: endTitle,
    content: endMessage
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
