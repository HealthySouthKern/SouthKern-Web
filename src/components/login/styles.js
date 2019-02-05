export const loginStyle = `

.login_container {
    height: 100%;
    width: 100%
    z-index: 0;
}

.login_card {
    width: 25%;
    height: 32%;
    
    position: absolute;
    top: 40%;
    bottom: 0;
    left: 0;
    right: 0;

    margin: auto;
    #background-color: #754315;
    border-radius: 10px;
    z-index: 0;
}

.login_logo {
    height: 200px;
    position: absolute;
    top: 0;
    bottom: 40%;
    left: 0;
    right: 0;

    margin: auto;
    z-index: 0;
}

.text_wrapper {
    z-index: 0;
    position: relative;
    width: 95%;
    margin: auto;
}

.login_email {
    margin: 5% 0 5% 0;
    z-index: 99;
    background-color: #754315;
    color: white;
}

.login_password {
    margin: 5% 0 5% 0;
    z-index: 99;
    background-color: #754315;
    color: white;

}

.login {
    width: 100%;
    margin: 5% 0 5% 0;
    z-index: 99;

}

@media (max-width: 1000px) {
    .login_card {
        width: 100%;
        border-radius: 0;
        background-color: #754315;
        height: 50%;
    }
    
    .login_email {
        color: black;
        background-color: white;
        margin: 0 0 10% 0;
    }
    
    .login_password {
        color: black;
        background-color: white;
        margin: 0 0 10% 0;
    }
    
    .login {
        margin: 0 0 10% 0;
    }
    
    .text_wrapper {
        width: 95%;
        margin: auto;
        position: relative;
    }
    
    .login_logo {
        bottom: 50%;
    }
    
    .login_logo {
        height: 150px
    }
}

`;
