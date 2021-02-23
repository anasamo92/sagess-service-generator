import http from 'http';
import url from 'url';
function simpleGet(urlAddr, callback) {
    const callbackRequest = (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => callback(data));
    }
    http.get(url.parse(urlAddr, false), callbackRequest);
}

export {
    simpleGet
}