// File: src/app/(protected)/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    UserPlus,
    Edit,
    Trash2,
    Crown,
    Building,
    User,
    Mail,
    Calendar,
    Loader2,
    Shield,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { fetchAllUsers, updateUser, deleteUser } from '@/services/adminService';
import { format } from 'date-fns';

// Define user interface
interface AdminUser {
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

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const usersPerPage = 10;

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    // Filter users based on search and role filter
    useEffect(() => {
        let filtered = users;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.mail.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [users, searchQuery, roleFilter]);

    const loadUsers = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const data = await fetchAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
            setMessage({
                type: 'error',
                text: 'Failed to load users. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditUser = (user: AdminUser) => {
        setEditingUser({ ...user });
        setIsEditDialogOpen(true);
    };

    const handleDeleteUser = (user: AdminUser) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await updateUser(editingUser.id_utilisateur, {
                nom: editingUser.nom,
                prenom: editingUser.prenom,
                mail: editingUser.mail,
                role: editingUser.role,
                notification: editingUser.notification,
                langue: editingUser.langue
            });

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id_utilisateur === editingUser.id_utilisateur
                        ? { ...user, ...editingUser }
                        : user
                )
            );

            setMessage({
                type: 'success',
                text: 'User updated successfully.'
            });

            setIsEditDialogOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            setMessage({
                type: 'error',
                text: 'Failed to update user. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setIsSubmitting(true);

        try {
            await deleteUser(userToDelete.id_utilisateur);

            // Remove from local state
            setUsers(prevUsers =>
                prevUsers.filter(user => user.id_utilisateur !== userToDelete.id_utilisateur)
            );

            setMessage({
                type: 'success',
                text: 'User deleted successfully.'
            });

            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage({
                type: 'error',
                text: 'Failed to delete user. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Pagination
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // Role badge styling
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Admin
                    </Badge>
                );
            case 'restaurant':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        Restaurant
                    </Badge>
                );
            case 'user':
            default:
                return (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage all users and their roles on the platform.
                    </p>
                </div>
                <Button onClick={loadUsers} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        'Refresh'
                    )}
                </Button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-md ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Users Overview</CardTitle>
                    <CardDescription>
                        Total users: {users.length} |
                        Admins: {users.filter(u => u.role === 'admin').length} |
                        Restaurant Owners: {users.filter(u => u.role === 'restaurant').length} |
                        Regular Users: {users.filter(u => u.role === 'user').length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                    <SelectItem value="restaurant">Restaurant Owners</SelectItem>
                                    <SelectItem value="user">Regular Users</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Users Table */}
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No users found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="hidden md:table-cell">Birth Date</TableHead>
                                            <TableHead className="hidden md:table-cell">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.map((user) => (
                                            <TableRow key={user.id_utilisateur}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {user.prenom} {user.nom}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground md:hidden">
                                                        {user.mail}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        {user.mail}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getRoleBadge(user.role)}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {user.date_naissance ?
                                                            format(new Date(user.date_naissance), 'MMM d, yyyy')
                                                            : 'Not provided'
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge variant={user.email_verified ? "default" : "secondary"}>
                                                        {user.email_verified ? 'Verified' : 'Unverified'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditUser(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user)}
                                                            disabled={user.role === 'admin'} // Prevent deleting admins
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-medium">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and role permissions.
                        </DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prenom">First Name</Label>
                                    <Input
                                        id="prenom"
                                        value={editingUser.prenom}
                                        onChange={(e) => setEditingUser({
                                            ...editingUser,
                                            prenom: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nom">Last Name</Label>
                                    <Input
                                        id="nom"
                                        value={editingUser.nom}
                                        onChange={(e) => setEditingUser({
                                            ...editingUser,
                                            nom: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail">Email</Label>
                                <Input
                                    id="mail"
                                    type="email"
                                    value={editingUser.mail}
                                    onChange={(e) => setEditingUser({
                                        ...editingUser,
                                        mail: e.target.value
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={editingUser.role}
                                    onValueChange={(value: 'user' | 'restaurant' | 'admin') =>
                                        setEditingUser({
                                            ...editingUser,
                                            role: value
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Regular User
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="restaurant">
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4" />
                                                Restaurant Owner
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                                <Crown className="h-4 w-4" />
                                                Administrator
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="langue">Language</Label>
                                    <Select
                                        value={editingUser.langue}
                                        onValueChange={(value) =>
                                            setEditingUser({
                                                ...editingUser,
                                                langue: value
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notifications</Label>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="notification"
                                            checked={editingUser.notification}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                notification: e.target.checked
                                            })}
                                        />
                                        <Label htmlFor="notification">Enable notifications</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveUser} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {userToDelete?.prenom} {userToDelete?.nom}?
                            This action cannot be undone and will permanently remove the user and all their data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteUser} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete User'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}