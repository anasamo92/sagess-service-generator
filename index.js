#!/usr/bin/env node

'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _dot = require('dot');

var _dot2 = _interopRequireDefault(_dot);

var _lodash = require('lodash.topairs');

var _lodash2 = _interopRequireDefault(_lodash);

var _swaggerUtilities = require('./swagger-utilities');

var _httpUtilities = require('./http-utilities');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Variable
var _process$env = process.env,
    _process$env$TEMPLATE = _process$env.TEMPLATE_FOLDER,
    TEMPLATE_FOLDER = _process$env$TEMPLATE === undefined ? './node_modules/focus-service-generator/templates' : _process$env$TEMPLATE,
    _process$env$DEST_FOL = _process$env.DEST_FOLDER,
    DEST_FOLDER = _process$env$DEST_FOL === undefined ? './app/config/server/generated' : _process$env$DEST_FOL,
    _process$env$EOL = _process$env.EOL,
    EOL = _process$env$EOL === undefined ? '\n' : _process$env$EOL,
    SWAGGER_SOURCE = _process$env.SWAGGER_SOURCE;


if (!SWAGGER_SOURCE) {
    console.log('SWAGGER_SOURCE : You must define a Swagger source, as file:./my/swagger/file.json, or http://host/swagger');
    process.exit(9);
}

// Utilities
var toKebabCase = function toKebabCase(name) {
    return name.replace(/[A-Z]/g, function (match, offset, str) {
        return (offset ? '-' : '') + match.toLowerCase();
    });
};
var writeFile = function writeFile(filepath, content) {
    _fs2.default.writeFile(filepath, content, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log(filepath + ' was saved !');
    });
};
var safeMkdir = function safeMkdir(folderpath) {
    if (!_fs2.default.existsSync(folderpath)) {
        _fs2.default.mkdirSync(folderpath, '777');
    }
};
// Let's initialize the templates
_dot2.default.templateSettings.strip = false;
var templateRenderer = _dot2.default.process({ path: TEMPLATE_FOLDER });

var handleSwaggerGeneration = function handleSwaggerGeneration(data) {
    var groupes = (0, _swaggerUtilities.parseSwagger)(data);
    safeMkdir(DEST_FOLDER);

    var _loop = function _loop(name) {

        var filename = toKebabCase(name);
        var templateParams = {
            destFolder: DEST_FOLDER,
            filename: filename,
            name: name,
            operations: groupes[name].sort(function (a, b) {
                return a.name.localeCompare(b.name);
            })
        };

        // Let's apply each template
        (0, _lodash2.default)(templateRenderer).forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                renderer = _ref2[1];

            var renderResult = renderer(templateParams);
            var lineArray = renderResult.replace(/\r/g, '').split('\n');
            // First line of the template is the filepath
            var filepath = lineArray[0];
            // The rest of it the file content
            var fileContent = lineArray.slice(1).join(EOL);
            // Finally, write the file
            writeFile(filepath, fileContent);
        });
    };

    for (var name in groupes) {
        _loop(name);
    }
};

if (SWAGGER_SOURCE.startsWith('file:')) {
    _fs2.default.readFile(SWAGGER_SOURCE.substr(5), 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        handleSwaggerGeneration(data);
    });
} else {
    (0, _httpUtilities.simpleGet)(SWAGGER_SOURCE, handleSwaggerGeneration);
}