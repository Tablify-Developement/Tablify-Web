"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";


export default function SettingsProfile() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState("en");

    return (
        <Card className="max-w-lg mx-auto mt-10 p-4">
            <CardHeader>
                <CardTitle>Paramètres du profil</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nom et Prénom</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div>
                        <Label htmlFor="email">Adresse Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Notifications</Label>
                        <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>
                    <div>
                        <Label>Langue</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une langue" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="en">Anglais</SelectItem>
                                    <SelectItem value="fr">Français</SelectItem>
                                    <SelectItem value="es">Espagnol</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full mt-4">Enregistrer</Button>
                </div>
            </CardContent>
        </Card>
    );
}
