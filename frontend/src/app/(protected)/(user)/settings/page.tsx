"use client"

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUsersById, updateUser } from "@/services/utilisateurService";
import { useAuth } from "@/context/auth-context";

export default function SettingsProfile() {
    const [userInfo, setUserInfo] = useState({
        id_utilisateur: "",
        nom: "",
        prenom: "",
        mail: "",
        date_naissance: new Date(),
        notification: false,
        langue: "fr",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        async function getUserData() {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Convert user.id to string to ensure it matches the expected type
                const id_utilisateur = String(user.id); // Convert to string if it's a number

                const data = await fetchUsersById(id_utilisateur);

                if (data && data.length > 0) {
                    // Parse date if it's a string
                    const userData = data[0];
                    if (typeof userData.date_naissance === 'string') {
                        userData.date_naissance = new Date(userData.date_naissance);
                    }

                    setUserInfo(userData);
                } else if (user) {
                    // If no data returned but we have the user in context, use that
                    setUserInfo({
                        id_utilisateur: String(user.id),
                        nom: user.nom || "",
                        prenom: user.prenom || "",
                        mail: user.mail || "",
                        date_naissance: new Date(),
                        notification: false,
                        langue: "en",
                    });
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Erreur lors du chargement des données");
            } finally {
                setLoading(false);
            }
        }
        getUserData();
    }, [user]);

    const handleUpdate = async () => {
        try {
            // Ensure the ID is valid
            if (!userInfo.id_utilisateur) {
                console.error("Cannot update user: Missing ID");
                alert("Erreur: Identifiant utilisateur manquant");
                return;
            }

            // Convert id_utilisateur to string to ensure it matches the expected type
            await updateUser(String(userInfo.id_utilisateur), userInfo);
            alert("Mise à jour réussie !");
        } catch (err) {
            console.error("Update error:", err);
            alert("Erreur lors de la mise à jour");
        }
    };

    if (loading) return <p>Chargement...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <Card className="max-w-lg mx-auto mt-10 p-4">
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="nom">Last Name</Label>
                        <Input id="nom" value={userInfo.nom} onChange={(e) => setUserInfo({ ...userInfo, nom: e.target.value })} placeholder="John" />
                    </div>
                    <div>
                        <Label htmlFor="prenom">First Name</Label>
                        <Input id="prenom" value={userInfo.prenom} onChange={(e) => setUserInfo({ ...userInfo, prenom: e.target.value })} placeholder="Doe" />
                    </div>
                    <div>
                        <Label htmlFor="email">Mail address</Label>
                        <Input id="email" type="email" value={userInfo.mail} onChange={(e) => setUserInfo({ ...userInfo, mail: e.target.value })} placeholder="john.doe@example.com" />
                    </div>
                    <div>
                        <Label htmlFor="date_naissance">Birth Date</Label>
                        <Input
                            id="date_naissance"
                            type="date"
                            value={userInfo.date_naissance instanceof Date ? userInfo.date_naissance.toISOString().split('T')[0] : ''}
                            onChange={(e) => setUserInfo({
                                ...userInfo,
                                date_naissance: new Date(e.target.value)
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label>Notification</Label>
                        <Switch checked={true} disabled />
                    </div>
                    <div>
                        <Label>Langage</Label>
                        <Select value={userInfo.langue} onValueChange={(value) => setUserInfo({ ...userInfo, langue: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une langue" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="en">Anglais</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="w-full mt-4" onClick={handleUpdate}>Save Settings</Button>
                </div>
            </CardContent>
        </Card>
    );
}