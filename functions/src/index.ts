import * as functions from 'firebase-functions';

const axios = require('axios');
const qs = require('qs');

export const spotifyLogin = functions.https.onCall(async (data, context) =>{

  const code = data.code;
  const endpoint = 'https://accounts.spotify.com/api/token';
  const redirectURL = 'http://localhost:4200/callback';

  const clientID = functions.config().spotify.id;
  const clientSecret = functions.config().spotify.secret;

  const requestData = {
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': redirectURL,
    'client_id': clientID,
    'client_secret': clientSecret
  };

  const requestBody = qs.stringify(requestData);

  try {

    const res = await axios.post(endpoint, requestBody);
    return res;

  } catch (error) {
    return error
  }

});

