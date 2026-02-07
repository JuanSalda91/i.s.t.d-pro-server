//CONTROLLERS: Controllers are functions responsible for processing incoming HTTP requests, executing tha appropiate business logic, interacting with data models, and sending a response back to the client.
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');

/**
 * HELPER FUNCTION: Generate JWT Token
 * 
 * PURPOSE: Create a JWT token for authenticaed users
 * 
 * WHAT IS JWT?
 * JWT = JSON Web Token
 * A compact, self-contained token that proves user is authenticated
 * 
 * HOW IT WORKS:
 * 1. Server creared a token: jwt.sign({ id: userID}, SECRET_KEY, { expiresIn: '3h' })
 * 2. Client receives and stores token (in browser memory or localstorage)
 * 3. Client sends token with every request in Authorization header
 * 4. Server verifies token is valid and hasn't expired
 * 5. If valid, server processes the request
 * 
 * TOKEN STRUCTURE:
* header.payload.signature
* 
* EXAMPLE TOKEN:
* eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
* eyJpZCI6IjY1YTFmZDk4ZjY2ZDQ1MzIxMGNkZTEyMyIsImlhdCI6MTcwNTA0NDU2MCwi
* ZXhwIjoxNzA1NjQ5MzYwfQ.
* 8vZU7X-qY9jK4mL2nO3pQ8rS5tU6vW7xY8z9A0b1C
*/