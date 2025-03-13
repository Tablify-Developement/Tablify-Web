import axios from 'axios';

const API_URL = 'http://localhost:3001/api/test'; // Replace with your backend URL

// Fetch test tasks
export const fetchTest = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};