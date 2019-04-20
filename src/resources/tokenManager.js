import tokens from './strings.js'

class TokenManager {

    static getFirebaseAPIToken() {
        return tokens.firebase_api_key
    }

    static getSendbirdAPIToken() {
        return tokens.sendbird_api_key
    }

    static getSendbirdAppId() {
        return tokens.sendbird_app_id
    }

}

export default TokenManager;