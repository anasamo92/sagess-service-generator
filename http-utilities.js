'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.simpleGet = undefined;

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function simpleGet(urlAddr, callback) {
    var callbackRequest = function callbackRequest(response) {
        var data = '';
        response.on('data', function (chunk) {
            return data += chunk;
        });
        response.on('end', function () {
            return callback(data);
        });
    };
    _http2.default.get(_url2.default.parse(urlAddr, false), callbackRequest);
}

exports.simpleGet = simpleGet;