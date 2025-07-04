const express = require('express');
require('dotenv').config();

const { sendGetRequest, sendPostRequest } = require('./controllers/marketFetcherOHLCV.controller');

const app = express();

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World from your Node.js application!');
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);

  // Give agent a factor to predict future trades and price movements 
  const getRequestPath = '/api/v5/dex/market/trades';
  const getParams = {
      'chainIndex': 8453,
      'tokenContractAddress': '0xbc45647ea894030a4e9801ec03479739fa2485f0',
      'limit': 500
  };
  console.log("\nInitiating GET request...");
  sendGetRequest(getRequestPath, getParams);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1); // Exit the process after an uncaught exception
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1); // Exit the process after an unhandled rejection
});