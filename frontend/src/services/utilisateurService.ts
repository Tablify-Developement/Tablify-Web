import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
    } catch (err: any) {
        if (axios.isAxiosError(err) && err.response) {
            const { status, data: body } = err.response;
            if (status === 409) {
                throw new Error("An account already exists with this email address.");
            }
            if (status === 400) {
                throw new Error((body as any).message || "Invalid registration data.");
            }
            throw new Error((body as any).message || "Registration failed.");
        }
        throw new Error("Network error, please try again later.");
    }
};

// Login user
export const loginUser = async (data: LoginData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, data);
        return response.data;
    } catch (err: any) {
        if (axios.isAxiosError(err) && err.response) {
            const { status, data: body } = err.response;
            if (status === 401) {
                throw new Error("Incorrect email or password.");
            }
            if (status === 404) {
                throw new Error("User not found.");
            }
            throw new Error((body as any).message || "Login failed.");
        }
        throw new Error("Network error, please try again later.");
    }
};

// Fetch user by ID
export const fetchUsersById = async (id_utilisateur: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${id_utilisateur}`);
        console.log("Raw API response: ", response.data);

        // Handle the case where response.data is not an array
        if (!Array.isArray(response.data)) {
            // If response.data is a single user object, wrap it in an array
            if (response.data && typeof response.data === 'object') {
                // Return the user object in an array format with proper property mapping
                return [{
                    id_utilisateur: response.data.id || response.data.id_utilisateur,
                    nom: response.data.nom,
                    prenom: response.data.prenom,
                    mail: response.data.mail,
                    role: response.data.role,
                    notification: response.data.notification,
                    langue: response.data.langue,
                    date_naissance: response.data.date_naissance
                }];
            }
            // If not a valid user object, return empty array
            console.error("Unexpected API response format:", response.data);
            return [];
        }

        // If it is an array, filter and map the data as before
        const filteredData = response.data.filter((utilisateur: any) =>
            utilisateur.id_utilisateur === id_utilisateur || utilisateur.id === id_utilisateur
        );
        console.log("Filtered by id_utilisateur", filteredData);

        return filteredData.map((utilisateur: any) => ({
            id_utilisateur: utilisateur.id_utilisateur || utilisateur.id,
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

        // Handle the case where response.data is not an array
        if (!Array.isArray(response.data)) {
            // Return empty array if not expected format
            console.error("Unexpected API response format:", response.data);
            return [];
        }

        const filteredData = response.data.filter((utilisateur: any) =>
            utilisateur.id_utilisateur === id_interet || utilisateur.id === id_interet
        );

        console.log("Filtered by id_interet", filteredData);

        return filteredData.map((utilisateur: any) => ({
            id_interet: utilisateur.id_interet,
            id_utilisateur: utilisateur.id_utilisateur || utilisateur.id,
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
