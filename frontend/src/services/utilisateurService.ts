import axios from 'axios';
import { User } from "lucide-react";

const API_BASE_URL = 'http://localhost:3001/api';

interface Utilisateur {
    id_utilisateur: string;
    nom: string;
    prenom: string;
    mail: string;
    role: string;
    notification: boolean;
    langue: string;
    date_naissance: Date;
}

// Create a new user
export const createUser = async (data: {
    id_utilisateur: string;
    nom: string;
    prenom: string;
    mail: string;
    role: string;
    notification: boolean;
    langue: string;
    date_naissance: Date;
}): Promise<Utilisateur> => {
    try {
        const reponse = await axios.post(`${API_BASE_URL}/users`, data);
        return reponse.data;
    } catch (error) {
        console.error("Error creating user: ", error);
        throw error;
    }
};

// Fetch users
export const fetchUsersById = async () => {
    try {
        const reponse = await axios.get(`${API_BASE_URL}/users/${id_utilisateur}`);
        console.log("Raw API response: ", reponse.data);

        const filteredData = reponse.data.filter((utilisateur: any) =>
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
        console.error("Error creating user: ", error);
        return [];
    }
};

export const fetchUserByInteret = async (id_interet: string) => {
    try{
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

export const updateUser = async (id_utilisateur: string, data: {
    id_utilisateur: string;
    nom: string;
    prenom: string;
    mail: string;
    role: string;
    notification: boolean;
    langue: string;
    date_naissance: Date;
}): Promise<UtilisateurSettings> => {
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
