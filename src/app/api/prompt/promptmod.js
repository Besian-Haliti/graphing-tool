import { createClient } from 'redis';

// Create a new Redis client using environment variables for security
const redis = createClient({
    username: process.env.REDIS_USERNAME, // Redis username
    password: process.env.REDIS_PASSWORD, // Redis password
    socket: {
        host: process.env.REDIS_URL, // Redis host
        port: process.env.REDIS_PORT, // Redis port
    },
});

redis.on('error', (err) => console.error('Redis Client Error:', err));

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect(); // Establish connection
    }
}

// Function to get a key from Redis
export async function getPrompt() {
    try {
        await connectRedis(); // Ensure connection is established
        return await redis.get("prompt");
    } catch (error) {
        console.error('Failed to retrieve prompt from Redis:', error);
        throw error;
    }
}

// Function to set/update a key in Redis
export async function setPrompt(newPrompt) {
    try {
        await connectRedis(); // Ensure connection is established
        await redis.set("prompt", newPrompt);
    } catch (error) {
        console.error('Failed to set prompt in Redis:', error);
        throw error;
    }
}

export default redis;
