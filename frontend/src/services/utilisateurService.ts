import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Updated User interface to match backend
interface Utilisateur {
    nom: string;
    prenom: string;
    mail: string;
    role?: string;
    notification?: boolean;
    langue?: string;
    date_naissance: Date;
}

// Registration data interface
interface RegistrationData {
    nom: string;
    prenom: string;
    mail: string;
    password: string;
    date_naissance: Date;
}

// Login data interface
interface LoginData {
    mail: string;
    password: string;
}

// Create a new user with registration data
export const createUser = async (data: RegistrationData): Promise<Utilisateur> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users`, {
            ...data,
            role: 'user',
            notification: false,
        });
        return response.data;
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        throw error;
    }
};

// Login user
export const loginUser = async (data: LoginData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, data);
        return response.data;
    } catch (error) {
        console.error("Error logging in: ", error);
        throw error;
    }
};

// Existing methods (kept for compatibility)
export const fetchUsersById = async (id_utilisateur: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${id_utilisateur}`);
        console.log("Raw API response: ", response.data);

        const filteredData = response.data.filter((utilisateur: any) =>
            utilisateur.id_utilisateur === id_utilisateur
        );
        console.log("Filtered by id_utilisateur", filteredData);

        return filteredData.map((utilisateur: any) => ({
            id_utilisateur: utilisateur.id_utilisateur,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            mail: utilisateur.mail,
            role: utilisateur.role,
            notification: utilisateur.notification,
            langue: utilisateur.langue,
            date_naissance: utilisateur.date_naissance
        }));
    } catch (error) {
        console.error("Error fetching users: ", error);
        return [];
    }
};

export const fetchUserByInteret = async (id_interet: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${id_interet}`);
        console.log("Raw API response: ", response.data);

        const filteredData = response.data.filter((utilisateur: any) =>
            utilisateur.id_utilisateur === id_interet
        );

        console.log("Filtered by id_interet", filteredData);

        return filteredData.map((utilisateur: any) => ({
            id_interet: utilisateur.id_interet,
            id_utilisateur: utilisateur.id_utilisateur,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            mail: utilisateur.mail,
            role: utilisateur.role,
            notification: utilisateur.notification,
            langue: utilisateur.langue,
            date_naissance: utilisateur.date_naissance
        }));
    } catch (error) {
        console.error("Error fetching user: ", error);
        return [];
    }
};

export const updateUser = async (id_utilisateur: string, data: Utilisateur) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/${id_utilisateur}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating user: ", error);
        throw error;
    }
};

export const deleteUser = async (id_utilisateur: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/users/${id_utilisateur}`);
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw error;
    }
};