'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.parseSwagger = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash.topairs');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Function extracting the type from the schema in swagger interface.
 * 
 * @param {any} schema the schema in an operation in swagger
 * @returns {string} the type to use
 */
function getTypeFromSchema(schema) {
    if (!schema) {
        return 'void';
    }
    var responseType = void 0;
    if ((schema.type || '').toLowerCase() === 'array') {
        responseType = 'Array<' + (schema.items["$ref"] ? schema.items["$ref"].split('/').slice(-1)[0] : schema.items.type) + '>';
    } else {
        responseType = schema["$ref"] ? schema["$ref"].split('/').slice(-1)[0] : schema.type;
    }
    // FIXME/TODO schema.type or schema.items.type should be converted in TS type
    return responseType;
}

/**
 * Function parsing a JSON Swagger interface, given as a string, and returning an object with extracted data.
 * 
 * @param {any} swaggerStr the swagger interface
 * @return {object} an object, with key as controller/web service name, containing array of endpoints
 */
function parseSwagger(swaggerStr) {
    var swaggerObject = JSON.parse(swaggerStr);
    var result = {};
    // Let's iterate over the paths in Swagger : http://swagger.io/specification/#paths-object-29
    (0, _lodash2.default)(swaggerObject.paths).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            pathName = _ref2[0],
            pathObj = _ref2[1];

        // Then let's iterate over each operation : http://swagger.io/specification/#operation-object-36
        (0, _lodash2.default)(pathObj).forEach(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
                httpVerb = _ref4[0],
                data = _ref4[1];

            var controllerName = data.tags[0]; // We use the tag to get the grouping name
            // If it is the first operation of a web service, we initialize it
            if (!result[controllerName]) {
                result[controllerName] = [];
            }

            // Let's get the name of the operation
            // Vertigo : the name is the summary
            // .NET/SwashBuckle : the operationId is the <controllerName>_<OperationName>
            var endpointName = data.operationId.startsWith(controllerName) ? data.operationId.split('_').slice(1).join('_') : data.summary;
            // Then, the name if put in camel case (lowercase for the first letter)
            endpointName = endpointName[0].toLowerCase() + endpointName.slice(1);

            // Let's get the response type in case of success : http://swagger.io/specification/#responses-object-54
            var responseType = 'void';
            (0, _lodash2.default)(data.responses).filter(function (_ref5) {
                var _ref6 = _slicedToArray(_ref5, 1),
                    httpResponseCode = _ref6[0];

                return +httpResponseCode >= 200 && +httpResponseCode < 300;
            }) // Let's keep succes code only
            .forEach(function (_ref7) {
                var _ref8 = _slicedToArray(_ref7, 2),
                    schema = _ref8[1].schema;

                responseType = getTypeFromSchema(schema);
            });

            // Let's get the documentation of the method
            // Vertigo : no doc ?
            // .NET/SwashBuckle : the doc is in summary
            var doc = data.operationId.startsWith(controllerName) ? data.summary : data.description;

            // Let's build the query string, from the parameters 
            var queryString = (data.parameters || []).filter(function (item) {
                return item.in === 'query';
            }).map(function (item) {
                return item.name + '=${' + item.name + '}';
            }).join('&');
            // Prepending the query string by ? if not empty
            queryString = queryString && queryString !== '' ? '?' + queryString : '';

            // Let's build the operation and add it to the groupe.
            result[controllerName].push({
                verb: httpVerb,
                path: pathName.replace(/{/g, '${'), // Adding the $ in front of {
                name: endpointName,
                responseType: responseType,
                summary: doc,
                parameters: (data.parameters || []).map(function (item) {
                    return {
                        position: item.in,
                        name: item.name,
                        required: item.required,
                        type: item.type,
                        format: item.format
                    };
                }),
                queryString: queryString
            });
        });
    });
    return result;
}

exports.parseSwagger = parseSwagger;