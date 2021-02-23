import entries from 'lodash.topairs';

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
    let responseType;
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
    const swaggerObject = JSON.parse(swaggerStr);
    const result = {};
    // Let's iterate over the paths in Swagger : http://swagger.io/specification/#paths-object-29
    entries(swaggerObject.paths).forEach(([pathName, pathObj]) => {
        // Then let's iterate over each operation : http://swagger.io/specification/#operation-object-36
        entries(pathObj).forEach(([httpVerb, data]) => {
            const controllerName = data.tags[0]; // We use the tag to get the grouping name
            // If it is the first operation of a web service, we initialize it
            if (!result[controllerName]) {
                result[controllerName] = [];
            }

            // Let's get the name of the operation
            // Vertigo : the name is the summary
            // .NET/SwashBuckle : the operationId is the <controllerName>_<OperationName>
            let endpointName = data.operationId.startsWith(controllerName) ? data.operationId.split('_').slice(1).join('_') : data.summary;
            // Then, the name if put in camel case (lowercase for the first letter)
            endpointName = endpointName[0].toLowerCase() + endpointName.slice(1);

            // Let's get the response type in case of success : http://swagger.io/specification/#responses-object-54
            let responseType = 'void';
            entries(data.responses)
                .filter(([httpResponseCode]) => +httpResponseCode >= 200 && +httpResponseCode < 300) // Let's keep succes code only
                .forEach(([, { schema }]) => {
                    responseType = getTypeFromSchema(schema);
                });

            // Let's get the documentation of the method
            // Vertigo : no doc ?
            // .NET/SwashBuckle : the doc is in summary
            let doc = data.operationId.startsWith(controllerName) ? data.summary : data.description;

            // Let's build the query string, from the parameters 
            let queryString = (data.parameters || []).filter(item => item.in === 'query').map(item => item.name + '=${' + item.name + '}').join('&');
            // Prepending the query string by ? if not empty
            queryString = queryString && queryString !== '' ? '?' + queryString : '';

            // Let's build the operation and add it to the groupe.
            result[controllerName].push({
                verb: httpVerb,
                path: pathName.replace(/{/g, '${'), // Adding the $ in front of {
                name: endpointName,
                responseType,
                summary: doc,
                parameters: (data.parameters || []).map(item => ({
                    position: item.in,
                    name: item.name,
                    required: item.required,
                    type: item.type,
                    format: item.format
                })),
                queryString
            });
        })
    });
    return result;
}

export {
    parseSwagger
}