import tokens from './strings.js'

class TokenManager {

    static getFirebaseAPIToken() {
        return tokens.firebase_api_key
    }
}

export default TokenManager;