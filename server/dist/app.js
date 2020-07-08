"use strict";
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 8080;
const firebase = require('firebase');
const fb = firebase.initializeApp({
    apiKey: 'AIzaSyDCF3Bl0KvlDjjsnK5i6TLa9NZjCetgBPE',
    authDomain: 'presave-app.firebaseapp.com',
    databaseURL: 'https://presave-app.firebaseio.com',
    projectId: 'presave-app',
    storageBucket: 'presave-app.appspot.com',
    messagingSenderId: '565477002562',
    appId: '1:565477002562:web:6bb7de375ed1a9e1438cdb'
});
// Use JSON parser
app.use(express.json());
// Status endpoint
app.get('/', (req, res) => {
    res.status(200);
    res.send('Presave API running');
});
// Spotify login endpoint
app.post('/login', async (req, res) => {
    // Get token from Request
    if (req.body.token === undefined) {
        res.status(400);
        res.send('Missing authorization token');
        return;
    }
    const token = req.body.token;
    // Get user data with token
    // Check if user has presaved before
    // Store data in Firestore
    res.send('done');
});
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
const getTokenFromAuth = (token) => {
};
//# sourceMappingURL=app.js.map