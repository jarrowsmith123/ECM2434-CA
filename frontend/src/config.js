// Configuration file for environment variables

// Get the API URL from the environment variable or fallback to localhost:8000
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default {
  API_URL
}; 