import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import Constants from '../Constants';
import MockAdapter from "axios-mock-adapter";
import Authentication from "./Authentication";

class RequestConfigBuilder {
    mContent;
    mContentType;
    mParams;
    mAccept;

    constructor() {
        this.mContentType = Constants.JSON_LD_MIME_TYPE;
        this.mAccept = Constants.JSON_LD_MIME_TYPE;
    }

    content(value) {
        this.mContent = value;
        return this;
    }

    contentType(value) {
        this.mContentType = value;
        return this;
    }

    params(value) {
        this.mParams = value;
        return this;
    }

    accept(value) {
        this.mAccept = value;
        return this;
    }

    getContent() {
        return this.mContent;
    }

    getContentType() {
        return this.mContentType;
    }

    getParams() {
        return this.mParams;
    }

    getAccept() {
        return this.mAccept;
    }
}

export function content(value) {
    return new RequestConfigBuilder().content(value);
}

export function params(value) {
    return new RequestConfigBuilder().params(value);
}

export function accept(value) {
    return new RequestConfigBuilder().accept(value);
}

export class Ajax {

    axiosInstance = axios.create({
        baseURL: Constants.SERVER_URL
    });

    constructor() {
        this.axiosInstance.interceptors.request.use(reqConfig => {
            reqConfig.headers[Constants.AUTHORIZATION_HEADER] = Authentication.loadToken();
            return reqConfig;
        });
        this.axiosInstance.interceptors.response.use((resp) => {
            if (resp.headers && resp.headers[Constants.AUTHORIZATION_HEADER]) {
                Authentication.saveToken(resp.headers[Constants.AUTHORIZATION_HEADER]);
            }
            return resp;
        }, (error) => {
            if (!error.response) {
                return Promise.reject({
                    messageId: 'connection.error'
                });
            }
            const response = error.response;
            // if (response.status === Constants.STATUS_UNAUTHORIZED) {
            //     Routing.transitionTo(Routes.login);
            // }
            if (typeof response.data === "string") {
                return Promise.reject({
                    messageId: 'ajax.unparseable-error',
                    status: response.status
                });
            } else {
                return Promise.reject(Object.assign({}, response.data, {status: response.status}));
            }
        });
        if (Constants.REACT_APP_MOCK_REST_API) {
            // Mock backend REST API if the environment is configured to do so
            mockRestApi(this.axiosInstance);
        }
    }

    get(path, config = new RequestConfigBuilder()) {
        const conf = {
            params: config.getParams(),
            headers: {
                'Accept': config.getAccept()
            }
        };
        return this.axiosInstance.get(path, conf).then(resp => resp.data);
    }

    post(path, config) {
        const conf = {
            headers: {
                'Content-Type': config.getContentType()
            }
        };
        const par = new URLSearchParams();
        // @ts-ignore
        const paramData = config.getParams() !== undefined ? config.getParams() : {};
        Object.keys(paramData).forEach(n => par.append(n, paramData[n]));

        if (config.getContentType() === Constants.X_WWW_FORM_URLENCODED) {
            return this.axiosInstance.post(path, par, conf);
        } else {
            const query = config.getParams() ? "?" + par.toString() : "";
            return this.axiosInstance.post(path + query, config.getContent(), conf);
        }
    }

    put(path, config) {
        const conf = {
            params: config.getParams(),
            headers: {
                'Accept': config.getAccept(),
                'Content-Type': config.getContentType()
            }
        };
        return this.axiosInstance.put(path, config.getContent(), conf);
    }

    delete(path, config) {
        let
            conf;

        if (config) {
            conf = {
                params: config.getParams()
            };
        }

        return this
            .axiosInstance
            .delete(path, conf);
    }
}

function mockRestApi(axiosInst) {
    const mock = new MockAdapter(axiosInst, {delayResponse: 500});
    const header = {};
    // Mock current user data
    mock.onGet(/\/whisper/).reply(200, require('./rest-mock/exampleResponse.json'), header);
}

const instance = new Ajax();

export default instance;

