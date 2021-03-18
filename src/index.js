#!/usr/bin/env node
'use strict';

import fs from 'fs';
import dot from 'dot';
import entries from 'lodash.topairs';

import { parseSwagger } from './swagger-utilities';
import { simpleGet } from './http-utilities';

// Variable
const {
    TEMPLATE_FOLDER = './node_modules/focus-service-generator/templates',
    DEST_FOLDER = './app/config/server/generated',
    EOL = '\n',
    SWAGGER_SOURCE
} = process.env;

if (!SWAGGER_SOURCE) {
    console.log('SWAGGER_SOURCE : You must define a Swagger source, as file:./my/swagger/file.json, or http://host/swagger');
    process.exit(9);
}

// Utilities
const toKebabCase = (name) => name.replace(/[A-Z]/g, (match, offset, str) => (offset ? '-' : '') + match.toLowerCase())
const writeFile = (filepath, content) => {
    fs.writeFile(filepath, content, err => {
        if (err) {
            return console.log(err);
        }
        console.log(`${filepath} was saved !`);
    })
};
const safeMkdir = (folderpath) => {
    if (!fs.existsSync(folderpath)) {
        fs.mkdirSync(folderpath, '777');
    }
}
// Let's initialize the templates
dot.templateSettings.strip = false;
const templateRenderer = dot.process({ path: TEMPLATE_FOLDER });


const handleSwaggerGeneration = (data) => {
    const groupes = parseSwagger(data);
    safeMkdir(DEST_FOLDER);

    for (let name in groupes) {

        const filename = toKebabCase(name);
        const templateParams = {
            destFolder: DEST_FOLDER,
            filename,
            name,
            operations: groupes[name].sort((a, b) => a.name.localeCompare(b.name))
        };

        // Let's apply each template
        entries(templateRenderer).forEach(([, renderer]) => {

            const renderResult = renderer(templateParams)
            const lineArray = renderResult.replace(/\r/g, '').split('\n');
            // First line of the template is the filepath
            const filepath = lineArray[0];
            // The rest of it the file content
            const fileContent = lineArray.slice(1).join(EOL);
            // Finally, write the file
            writeFile(filepath, fileContent);
        });
    }
}

if (SWAGGER_SOURCE.startsWith('file:')) {
    fs.readFile(SWAGGER_SOURCE.substr(5), 'utf8', (err, data) => {
        if (err) {
            return console.log(err);
        }
        handleSwaggerGeneration(data);
    });
} else {
    simpleGet(SWAGGER_SOURCE, handleSwaggerGeneration);
}

