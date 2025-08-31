import axios from 'axios';

const API_URL = 'tablify-web-n6fn.onrender.com/api'; // Replace with your backend URL

// Fetch test tasks
export const fetchTest = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};