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
