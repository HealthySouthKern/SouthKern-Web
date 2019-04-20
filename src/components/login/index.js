import React, { Component } from 'react';
import { Input, Button, Card, Modal, message } from "antd";

import firebase from '../../firebase'

// Styles
import { loginStyle } from './styles';
import bhc_logo from '../../resources/assets/bhc_logo_color_centered.png';

const addPerformedAction = firebase.functions().httpsCallable('addPerformedAction');

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            password: '',
            recoveryEmail: '',
            loadingReset: false
        };

        this.displayChatWidget = this.displayChatWidget.bind(this);
    }

    componentWillMount() {
        this.displayChatWidget(false);
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                if (this.props) {
                    this.displayChatWidget(true);
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
                            this.displayChatWidget(true);
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

    handleForgottenPassword() {
        this.setState({
            modalVisible: true
        })
    }

    handleCancel = (e) => {
        console.log(e);
        this.setState({
            modalVisible: false,
        });
    };

    sendRecoveryEmail() {
        const { recoveryEmail } = this.state;

        this.setState({ loadingReset: true });

        firebase.auth().sendPasswordResetEmail(recoveryEmail).then(() => {
            this.setState({ loadingReset: false });
            message.success('Password recovery email sent successfully!');
        })
    }

    displayChatWidget(bool) {
        const widget = document.getElementById("sb_widget");
        if (bool) {
            widget.style.display = 'block'
        } else {
            widget.style.display = 'none'
        }
    }

    render() {
        return (
            <div className='login_container'>
                <img className='login_logo' src={bhc_logo} alt='' />
                <Modal
                    title="Password Recovery"
                    visible={this.state.modalVisible}
                    onCancel={this.handleCancel}
                    footer={
                        <Button onClick={(e) => this.handleCancel(e)}>Cancel</Button>
                    }
                >
                    <p style={{ marginBottom: 10 }}>Email to send recovery form to</p>
                    <Input placeholder='Email here...' onChange={e => this.setState({recoveryEmail: e.target.value})} />
                    <Button loading={this.state.loadingReset} onClick={() => this.sendRecoveryEmail()} style={{ marginTop: 10 }} type='primary'>Send recovery email</Button>
                </Modal>
                <Card className='login_card'>
                    <div className='text_wrapper'>
                        <Input className='login_email' value={this.state.email} placeholder='Email' type='email' onChange={(e) => this.setState({ email: e.target.value })} />
                        <Input className='login_password' value={this.state.password} placeholder='Password' type='password' onChange={(e) => this.setState({ password: e.target.value })} />
                        <a className='login_forgot' onClick={() => this.handleForgottenPassword()} href="#">Forgot password</a>
                        <Button className='login' onClick={() => this.onLoginClicked()} >Login</Button>
                    </div>
                </Card>
                <style>{loginStyle}</style>
            </div>
        )
    }

}

export default Login;