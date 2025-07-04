const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

const api_config = {
  "api_key": process.env.OKX_API_KEY || '',
  "secret_key": process.env.OKX_SECRET_KEY || '',
  "passphrase": process.env.OKX_API_PASSPHRASE || '',
};

/**
 * Generates a pre-signature string based on timestamp, method, request path, and parameters.
 * @param {string} timestamp - ISO 8601 formatted timestamp.
 * @param {string} method - HTTP method (GET or POST).
 * @param {string} request_path - The API endpoint path.
 * @param {object} params - Request parameters.
 * @returns {string} The pre-signed string.
 */
function preHash(timestamp, method, request_path, params) {
  let query_string = '';
  if (method === 'GET' && params) {
    // For GET requests, parameters are part of the query string
    query_string = '?' + querystring.stringify(params);
  } else if (method === 'POST' && params) {
    // For POST requests, parameters are stringified JSON in the body
    query_string = JSON.stringify(params);
  }
  // The message to be signed is a concatenation of timestamp, method, path, and query/body
  return timestamp + method + request_path + query_string;
}

/**
 * Signs a message using HMAC-SHA256 with the given secret key.
 * @param {string} message - The message to sign.
 * @param {string} secret_key - The secret key for signing.
 * @returns {string} The base64 encoded signature.
 */
function sign(message, secret_key) {
  const hmac = crypto.createHmac('sha256', secret_key);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Creates the signature and timestamp for an API request.
 * @param {string} method - HTTP method (GET or POST).
 * @param {string} request_path - The API endpoint path.
 * @param {object} params - Request parameters.
 * @returns {{signature: string, timestamp: string}} An object containing the signature and timestamp.
 */
function createSignature(method, request_path, params) {
  // Get the current timestamp in ISO 8601 format (e.g., 2023-07-04T17:24:00.000Z)
  const timestamp = new Date().toISOString().slice(0, -5) + 'Z';
  // Generate the message to be signed
  const message = preHash(timestamp, method, request_path, params);
  // Generate the signature
  const signature = sign(message, api_config['secret_key']);
  return { signature, timestamp };
}

/**
 * Sends a GET request to the specified OKX API path.
 * @param {string} request_path - The API endpoint path.
 * @param {object} params - Query parameters for the GET request.
 */
const sendGetRequest = (request_path, params) => {
  // Generate the signature and timestamp required for OKX API authentication
  const { signature, timestamp } = createSignature("GET", request_path, params);

  // Define the request headers
  const headers = {
    'OK-ACCESS-KEY': api_config['api_key'],
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': api_config['passphrase'],
    'Content-Type': 'application/json' // Standard content type for JSON APIs
  };

  // Construct the options object for the HTTPS request
  const options = {
    hostname: 'web3.okx.com', // The hostname for the OKX API
    path: request_path + (params ? `?${querystring.stringify(params)}` : ''), // Append query parameters to the path
    method: 'GET', // HTTP method
    headers: headers // Custom headers for authentication
  };

  // Make the HTTPS request
  const req = https.request(options, (res) => {
    let data = '';
    // Accumulate data chunks received from the response
    res.on('data', (chunk) => {
      data += chunk;
    });
    // When the response ends, parse and log the data
    res.on('end', () => {
      try {
        console.log("GET Response:", JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        console.error("Error parsing GET response:", e);
        console.log("Raw GET response:", data);
      }
    });
  });

  // Handle request errors
  req.on('error', (e) => {
    console.error(`Problem with GET request: ${e.message}`);
  });

  // End the request (important for GET requests even if no body is sent)
  req.end();
};

/**
 * Sends a POST request to the specified OKX API path.
 * @param {string} request_path - The API endpoint path.
 * @param {object} params - Request body parameters for the POST request.
 */
const sendPostRequest = (request_path, params) => {
  // Generate the signature and timestamp
  const { signature, timestamp } = createSignature("POST", request_path, params);

  // Define the request headers
  const headers = {
    'OK-ACCESS-KEY': api_config['api_key'],
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': api_config['passphrase'],
    'Content-Type': 'application/json'
  };

  // Construct the options object for the HTTPS request
  const options = {
    hostname: 'web3.okx.com',
    path: request_path,
    method: 'POST',
    headers: headers
  };

  // Make the HTTPS request
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        console.log("POST Response:", JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        console.error("Error parsing POST response:", e);
        console.log("Raw POST response:", data);
      }
    });
  });

  // Handle request errors
  req.on('error', (e) => {
    console.error(`Problem with POST request: ${e.message}`);
  });

  // If there are parameters, write them to the request body as JSON
  if (params) {
    req.write(JSON.stringify(params));
  }

  // End the request
  req.end();
};

// Export the functions so they can be imported by other files (like app.js)
module.exports = {
  sendGetRequest,
  sendPostRequest
};