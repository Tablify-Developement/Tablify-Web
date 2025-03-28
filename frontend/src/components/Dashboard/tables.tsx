'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCaption,
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
    DialogTrigger,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    Loader2,
    TableProperties,
    Users
} from 'lucide-react';
import {
    fetchRestaurantTables,
    createTable,
    updateTable,
    deleteTable
} from '@/services/restaurantService';
import { useRestaurant } from '@/context/restaurant-context';

// Define types
interface Table {
    id: number;
    restaurant_id: number;
    table_number: string;
    capacity: string | number;
    location: string;
    status: string;
}

interface DialogState {
    isOpen: boolean;
    type: 'add' | 'edit';
    table: Partial<Table>;
}

export default function TablesPage() {
    const { selectedRestaurant } = useRestaurant();
    const restaurantId = selectedRestaurant?.id || 0;

    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogState, setDialogState] = useState<DialogState>({
        isOpen: false,
        type: 'add',
        table: {},
    });
    const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadTables = async () => {
            if (!restaurantId) {
                setTables([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setMessage({ type: '', text: '' });

            try {
                const data = await fetchRestaurantTables(restaurantId);
                setTables(data || []);
            } catch (error) {
                console.error('Error loading tables:', error);
                setMessage({
                    type: 'error',
                    text: 'Failed to load tables. Please try again.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadTables();
    }, [restaurantId]);

    const openAddDialog = () => {
        setDialogState({
            isOpen: true,
            type: 'add',
            table: {
                table_number: '',
                capacity: '',
                location: '',
                status: 'available'
            }
        });
    };

    const openEditDialog = (table: Table) => {
        setDialogState({
            isOpen: true,
            type: 'edit',
            table: { ...table }
        });
    };

    const closeDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const handleTableChange = (field: keyof Table, value: string) => {
        setDialogState(prev => ({
            ...prev,
            table: {
                ...prev.table,
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        if (!restaurantId) {
            setMessage({
                type: 'error',
                text: 'No restaurant selected. Please select a restaurant first.'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { table, type } = dialogState;

            if (!table.table_number || !table.capacity) {
                setMessage({
                    type: 'error',
                    text: 'Table number and capacity are required.'
                });
                setIsSubmitting(false);
                return;
            }

            let newTable: Table;
            if (type === 'add') {
                newTable = await createTable(restaurantId, {
                    table_number: table.table_number as string,
                    capacity: table.capacity as string,
                    location: table.location as string,
                    status: table.status as string
                });

                setTables(prev => [...prev, newTable]);
                setMessage({
                    type: 'success',
                    text: 'Table created successfully.'
                });
            } else {
                newTable = await updateTable(restaurantId, table.id as number, {
                    table_number: table.table_number as string,
                    capacity: table.capacity as string,
                    location: table.location as string,
                    status: table.status as string
                });

                setTables(prev =>
                    prev.map(t => t.id === newTable.id ? newTable : t)
                );
                setMessage({
                    type: 'success',
                    text: 'Table updated successfully.'
                });
            }

            closeDialog();
        } catch (error) {
            console.error('Error saving table:', error);
            setMessage({
                type: 'error',
                text: 'Failed to save table. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!tableToDelete || !restaurantId) return;

        try {
            await deleteTable(restaurantId, tableToDelete.id);
            setTables(prev => prev.filter(t => t.id !== tableToDelete.id));
            setMessage({
                type: 'success',
                text: 'Table deleted successfully.'
            });
        } catch (error) {
            console.error('Error deleting table:', error);
            setMessage({
                type: 'error',
                text: 'Failed to delete table. Please try again.'
            });
        } finally {
            setTableToDelete(null);
            setAlertOpen(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'occupied':
                return 'bg-red-100 text-red-800';
            case 'reserved':
                return 'bg-yellow-100 text-yellow-800';
            case 'maintenance':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Tables</h2>
                <Button onClick={openAddDialog} disabled={!restaurantId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Table
                </Button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-md ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Restaurant Tables</CardTitle>
                    <CardDescription>
                        Manage your restaurant's tables, their capacity, and status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!restaurantId ? (
                        <div className="text-center py-12 bg-muted/20 rounded-md">
                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                                <TableProperties className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">No Restaurant Selected</h3>
                            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                Please select a restaurant from the sidebar dropdown to manage tables.
                            </p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                                <TableProperties className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground mb-4">No tables found for this restaurant.</p>
                            <Button onClick={openAddDialog}>Add Your First Table</Button>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Table Number</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.map((table) => (
                                        <TableRow key={table.id}>
                                            <TableCell className="font-medium">{table.table_number}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    {table.capacity}
                                                </div>
                                            </TableCell>
                                            <TableCell>{table.location || 'Not specified'}</TableCell>
                                            <TableCell>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(table.status)}`}>
                                                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(table)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog open={alertOpen && tableToDelete?.id === table.id} onOpenChange={setAlertOpen}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setTableToDelete(table);
                                                                setAlertOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete table {table.table_number}. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogState.type === 'add' ? 'Add New Table' : 'Edit Table'}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogState.type === 'add'
                                ? 'Add a new table to your restaurant.'
                                : 'Edit the details of this table.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="table_number" className="text-right">
                                Table Number *
                            </Label>
                            <Input
                                id="table_number"
                                value={dialogState.table.table_number || ''}
                                onChange={(e) => handleTableChange('table_number', e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="capacity" className="text-right">
                                Capacity *
                            </Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={dialogState.table.capacity || ''}
                                onChange={(e) => handleTableChange('capacity', e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">
                                Location
                            </Label>
                            <Input
                                id="location"
                                value={dialogState.table.location || ''}
                                onChange={(e) => handleTableChange('location', e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Patio, Main Floor, etc."
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Status
                            </Label>
                            <Select
                                value={dialogState.table.status || 'available'}
                                onValueChange={(value) => handleTableChange('status', value)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}