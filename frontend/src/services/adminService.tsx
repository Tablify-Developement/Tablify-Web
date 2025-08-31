// File: src/services/adminService.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'tablify-web-n6fn.onrender.com/api';

// Type definitions for admin operations
interface User {
    id_utilisateur: string;
    nom: string;
    prenom: string;
    mail: string;
    role: 'user' | 'restaurant' | 'admin';
    date_naissance: string;
    email_verified: boolean;
    created_at?: string;
    notification: boolean;
    langue: string;
}

interface UserUpdateData {
    nom?: string;
    prenom?: string;
    mail?: string;
    role?: 'user' | 'restaurant' | 'admin';
    notification?: boolean;
    langue?: string;
}

// Fetch all users (admin only)
export const fetchAllUsers = async (): Promise<User[]> => {
    try {
        console.log('🔍 Fetching all users for admin panel...');
        const response = await axios.get(`/users`);

        console.log('📦 Users data received:', response.data);

        // Ensure we return an array
        if (!Array.isArray(response.data)) {
            console.warn('⚠️ Expected array but got:', typeof response.data);
            return [];
        }

        // Transform the data to match our interface
        return response.data.map((user: any) => ({
            id_utilisateur: user.id_utilisateur || user.id,
            nom: user.nom || '',
            prenom: user.prenom || '',
            mail: user.mail || user.email || '',
            role: user.role || 'user',
            date_naissance: user.date_naissance || '',
            email_verified: user.email_verified || false,
            created_at: user.created_at || '',
            notification: user.notification || false,
            langue: user.langue || 'en'
        }));
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
    }
};

// Update user (admin only)
export const updateUser = async (userId: string, updateData: UserUpdateData): Promise<User> => {
    try {
        console.log('🔄 Updating user:', userId, 'with data:', updateData);

        const response = await axios.put(`/users/${userId}`, updateData);

        console.log('✅ User updated successfully:', response.data);

        // Return the updated user data
        return {
            id_utilisateur: response.data.id_utilisateur || response.data.id || userId,
            nom: response.data.nom || updateData.nom || '',
            prenom: response.data.prenom || updateData.prenom || '',
            mail: response.data.mail || updateData.mail || '',
            role: response.data.role || updateData.role || 'user',
            date_naissance: response.data.date_naissance || '',
            email_verified: response.data.email_verified || false,
            created_at: response.data.created_at || '',
            notification: response.data.notification ?? updateData.notification ?? false,
            langue: response.data.langue || updateData.langue || 'en'
        };
    } catch (error) {
        console.error('❌ Error updating user:', error);
        throw error;
    }
};

// Delete user (admin only)
export const deleteUser = async (userId: string): Promise<void> => {
    try {
        console.log('🗑️ Deleting user:', userId);

        await axios.delete(`/users/${userId}`);

        console.log('✅ User deleted successfully');
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
    }
};

// Get user statistics (admin only)
export const getUserStatistics = async () => {
    try {
        console.log('📊 Fetching user statistics...');

        const users = await fetchAllUsers();

        const stats = {
            totalUsers: users.length,
            adminUsers: users.filter(u => u.role === 'admin').length,
            restaurantUsers: users.filter(u => u.role === 'restaurant').length,
            regularUsers: users.filter(u => u.role === 'user').length,
            verifiedUsers: users.filter(u => u.email_verified).length,
            unverifiedUsers: users.filter(u => !u.email_verified).length,
            recentUsers: users.filter(u => {
                if (!u.created_at) return false;
                const userDate = new Date(u.created_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return userDate > thirtyDaysAgo;
            }).length
        };

        console.log('📊 User statistics:', stats);
        return stats;
    } catch (error) {
        console.error('❌ Error fetching user statistics:', error);
        throw error;
    }
};

// Bulk update users (admin only)
export const bulkUpdateUsers = async (
    userIds: string[],
    updateData: Partial<UserUpdateData>
): Promise<void> => {
    try {
        console.log('🔄 Bulk updating users:', userIds, 'with data:', updateData);

        // Update users in parallel
        const updatePromises = userIds.map(userId =>
            updateUser(userId, updateData)
        );

        await Promise.all(updatePromises);

        console.log('✅ Bulk update completed successfully');
    } catch (error) {
        console.error('❌ Error in bulk update:', error);
        throw error;
    }
};

// Change user role (admin only)
export const changeUserRole = async (
    userId: string,
    newRole: 'user' | 'restaurant' | 'admin'
): Promise<User> => {
    try {
        console.log(`👑 Changing user ${userId} role to ${newRole}`);

        return await updateUser(userId, { role: newRole });
    } catch (error) {
        console.error('❌ Error changing user role:', error);
        throw error;
    }
};