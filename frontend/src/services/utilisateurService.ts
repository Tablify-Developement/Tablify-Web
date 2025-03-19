import axios from 'axios';
import { User } from "lucide-react";

const API_URL_CREATE = 'http://localhost:3001/api/users';
const API_URL_FETCH = 'http://localhost:3001/api/users';

// Create a new user
export const createUser = async (data: {
    nom: string;
    prenom: string;
    mail: string;
    role: string;
    notification: boolean;
    langue: string;
}) => {
    const response = await axios.post(API_URL_CREATE, data);
    return response.data;
};

// Fetch users
export const fetchUsers = async () => {
    try {
        const response = await axios.get(API_URL_FETCH);
        console.log("Raw API response:", response.data);

        return response.data.map((user: any) => ({
            name: `${user.prenom} ${user.nom}`,
            logo: User,
            role: user.role,
            langue: user.langue
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};
