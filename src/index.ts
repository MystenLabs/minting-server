import * as redis from 'redis';

// Connect to Redis server
const client = redis.createClient();

// Test the connection
client.on('connect', function() {
    console.log('DB Connection established');
});

// Hello World message
console.log('Hello World!');
