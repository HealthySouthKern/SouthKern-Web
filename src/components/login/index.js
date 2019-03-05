import React, { Component } from 'react';
import { Input, Button, Card } from "antd";

import firebase from '../../firebase'

// Styles
import { loginStyle } from './styles';
import bhc_logo from '../../resources/assets/bhc_logo_color_centered.png';

const fetchUserWithUserID = firebase.functions().httpsCallable('fetchUserwithUserID');
const addPerformedAction = firebase.functions().httpsCallable('addPerformedAction');

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            password: '',
        }
    }

    componentWillMount() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                if (this.props) {
                    this.props.history.push('/');
                }
            }
        });
    }

    onLoginClicked() {
        let email = this.state.email;
        let password = this.state.password;

        firebase.auth().signInWithEmailAndPassword(email, password).then(() => {
            const currentUser = firebase.auth().currentUser;

            currentUser.getIdToken().then((token) => {
                    firebase.database().ref(`southkernUsers/${currentUser.uid}`).once('value').then((user) => {
                        const firebaseUser = user.val();
                        if (firebaseUser.user_type === 'admin') {

                            // route
                            localStorage.setItem('bhc_user', JSON.stringify(firebaseUser));
                            localStorage.setItem('bhc_token', token);

                            addPerformedAction({token: token, user_name: firebaseUser.user_name, action: 'logged in', date: Date.now()}).then(() => {
                                // history item created
                            }).catch(err => {
                                console.log(err);
                            });

                            this.setState({ email: '', password: '' });

                            this.props.history.push('/dashboard');
                        } else {
                            // not an admin -> sign out of firebase
                            firebase.auth().signOut().then(() => {
                                // sign out successful
                                console.log('signed out')
                            });
                        }
                    });
            });
        }).catch(function(error) {
            // Handle Errors here.
            console.log(error);
        });
    }

    render() {
        return (
            <div className='login_container'>
                <img className='login_logo' src={bhc_logo} alt='' />

                <Card className='login_card'>
                    <div className='text_wrapper'>
                        <Input className='login_email' value={this.state.email} placeholder='Email' type='email' onChange={(e) => this.setState({ email: e.target.value })} />
                        <Input className='login_password' value={this.state.password} placeholder='Password' type='password' onChange={(e) => this.setState({ password: e.target.value })} />
                        <Button className='login' onClick={() => this.onLoginClicked()} >Login</Button>
                    </div>
                </Card>
                <style>{loginStyle}</style>
            </div>
        )
    }

}

export default Login;