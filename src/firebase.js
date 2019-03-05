import firebase from 'firebase'
import "firebase/functions";

import TokenManager from './resources/tokenManager'

// Initialize Firebase
const config = {
    apiKey: TokenManager.getFirebaseAPIToken(),
    authDomain: "southkerntest01.firebaseapp.com",
    databaseURL: "https://southkerntest01.firebaseio.com",
    projectId: "southkerntest01",
    storageBucket: "southkerntest01.appspot.com",
    messagingSenderId: "726181107283"
};
const fire = firebase.initializeApp(config);

export default fire;
