import Constants from '../Constants';

export default class Authentication {

    static saveToken(jwt) {
        localStorage.setItem(Constants.STORAGE_JWT_KEY, jwt);
    }

    static loadToken() {
        const jwt = localStorage.getItem(Constants.STORAGE_JWT_KEY);
        return jwt != null ? jwt : '';
    }

    static clearToken() {
        localStorage.removeItem(Constants.STORAGE_JWT_KEY);
    }
}