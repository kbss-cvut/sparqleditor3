import React, {Component} from 'react';
import YASQE from 'yasgui-yasqe';
import './Yasqe.css';
import Constants from './Constants';
import Ajax, {params} from './ajax/Ajax';

// autocompleter for the Query Index Web Service

class Yasqe extends Component {

    constructor(props) {
        super(props);
        console.log(JSON.stringify(props));
        this.yasqe = null;
        this.state= {
            lastParsableQuery:""
        }
    }

    componentDidUpdate() {
        this.yasqe.refresh();
    }

    componentDidMount() {
        YASQE.defaults.sparql.showQueryButton = true;
        YASQE.defaults.sparql.endpoint = Constants.SPARQL_ENDPOINT;
        YASQE.defaults.sparql.callbacks.success = function (data) {
            console.log("success", data);
        };

        const localThis = this;

        const queryIndexCompleter = function (yasqe) {
            const tripleToPrefixed = (triple) => {
                return triple.split(" ").map(token => iriToPrefixed(token) ).join(" ");
            };

            const iriToPrefixed = (token) => {
                const queryPrefixes = yasqe.getPrefixesFromQuery();
                const tokenCan = token.indexOf("<") > -1 ? token.substring(1,token.length-1) : token;

                for(const prefix in queryPrefixes) {
                    const i = tokenCan.indexOf(queryPrefixes[prefix]);
                    if (i > -1) {
                        return prefix+":"+tokenCan.substring(i+queryPrefixes[prefix].length);
                    }
                }
                return token;
            };

            const returnObj = {
                isValidCompletionPosition: function () {
                    var token = yasqe.getCompleteToken();
                    if (yasqe.queryValid) {
                        localThis.setState({lastParsableQuery : yasqe.getValue()});
                    }
                    var cur = yasqe.getCursor();
                    var previousToken = yasqe.getPreviousNonWsToken(cur.line, token);
                    console.log(previousToken)
                    // if (previousToken.type === null || previousToken.string === ".") {
                    //     return true;
                    // } else {
                        return true;
                    // }
                },
                preProcessToken: function (token) {
                    return token;
                },
                postProcessToken: function (token, suggestedString) {
                    return tripleToPrefixed( suggestedString );
                }
            };
            const yq = yasqe;
            returnObj.bulk = false;
            returnObj.async = true;
            returnObj.autoShow = false;
            returnObj.get = function (token, callback) {
                console.log("GETTING ")
                Ajax.get(Constants.SERVER+"/rest/suggest/suggest-tpc",params({
                        lastValidQuery:localThis.state.lastParsableQuery,
                        currentQuery:yq.getValue(),
                        currentQueryCursor:yq.getCursor()
                })
                ).then((data) => {
                    callback(data.map(d => d.value));
                });
            };
            return returnObj;
        };
        YASQE.registerAutocompleter('queryIndexCompleter', queryIndexCompleter);

        //And, to make sure we don't use the other property and class autocompleters, overwrite the default enabled completers
        YASQE.defaults.autocompleters = ['queryIndexCompleter', 'prefixes'];

        //finally, initialize YASQE
        this.yasqe = YASQE(this.refs.yasqe);
    }

    render() {
        return (
            <div>
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Task {this.props.taskNum} description</h4>
                        <div ref="yasqe"/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Yasqe;
