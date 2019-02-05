import firebase from 'firebase'
import "firebase/functions";

// Initialize Firebase
const config = {
    apiKey: "AIzaSyDtipUzH0lqYdn6Nr5SENn_f88zj9E5Xrs",
    authDomain: "southkerntest01.firebaseapp.com",
    databaseURL: "https://southkerntest01.firebaseio.com",
    projectId: "southkerntest01",
    storageBucket: "southkerntest01.appspot.com",
    messagingSenderId: "726181107283"
};
const fire = firebase.initializeApp(config);

export default fire;
