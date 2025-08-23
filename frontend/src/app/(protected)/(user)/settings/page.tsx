"use client"

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X, Plus, Users } from "lucide-react";
import { fetchUsersById, updateUser } from "@/services/utilisateurService";
import { useAuth } from "@/context/auth-context";
import interetService, { Interet } from "@/services/interetService";

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
    
    // States for the centers of interests
    const [userInterets, setUserInterets] = useState<Interet[]>([]);
    const [suggestedInterets, setSuggestedInterets] = useState<{[category: string]: string[]}>({});
    const [newInteret, setNewInteret] = useState<string>('');
    const [newInteretIntensity, setNewInteretIntensity] = useState<number>(3);
    const [isLoadingInterets, setIsLoadingInterets] = useState(false);
    const [interetsMessage, setInteretsMessage] = useState({ type: '', text: '' });
    const [activeCategory, setActiveCategory] = useState<string>('');

    // States for matching toggle
    const [matchingEnabled, setMatchingEnabled] = useState(false);
    const [isLoadingMatching, setIsLoadingMatching] = useState(false);
    const [matchingMessage, setMatchingMessage] = useState({ type: '', text: '' });

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
                    
                    // Charger les centres d'intérêt de l'utilisateur
                    fetchUserInterets(userData.id_utilisateur);
                    fetchSuggestedInterets();
                    fetchMatchingStatus(); // Charger le statut du matching
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
                    
                    // Charger les centres d'intérêt de l'utilisateur
                    fetchUserInterets(String(user.id));
                    fetchSuggestedInterets();
                    fetchMatchingStatus(); // Charger le statut du matching
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Error loading data");
            } finally {
                setLoading(false);
            }
        }
        getUserData();
    }, [user]);
    
    // Get user interests
    const fetchUserInterets = async (userId: string) => {
        if (!userId) return;
        
        setIsLoadingInterets(true);
        try {
            const response = await interetService.getUserInterets(userId);
            setUserInterets(response.data.interets || []);
        } catch (error) {
            console.error("Error retrieving user interests:", error);
        } finally {
            setIsLoadingInterets(false);
        }
    };

    // Get interest suggestions organized by categories
    const fetchSuggestedInterets = async () => {
        try {
            const response = await interetService.getSuggestedInterets();
            const categories = response.data.categories || {};
            setSuggestedInterets(categories);
            
            // Set the first category as active if there are categories and no active category is set
            if (Object.keys(categories).length > 0 && !activeCategory) {
                setActiveCategory(Object.keys(categories)[0]);
            }
        } catch (error) {
            console.error("Error retrieving interest suggestions:", error);
        }
    };

    // Get matching status
    const fetchMatchingStatus = async () => {
        try {
            const response = await interetService.getMatchingStatus();
            setMatchingEnabled(response.data.matching_enabled || false);
        } catch (error) {
            console.error("Error retrieving matching status:", error);
        }
    };

    // Toggle matching activation
    const handleToggleMatching = async () => {
        setIsLoadingMatching(true);
        try {
            const response = await interetService.toggleMatching();
            setMatchingEnabled(response.data.matching_enabled);
            
            setMatchingMessage({
                type: response.data.matching_enabled ? 'success' : 'error',
                text: response.data.matching_enabled 
                    ? 'Social matching activated! You can now be matched with other users.'
                    : 'Social matching deactivated. You will not appear in matching results.'
            });
            
            setTimeout(() => setMatchingMessage({ type: '', text: '' }), 4000);
        } catch (error) {
            console.error("Error toggling matching:", error);
            setMatchingMessage({
                type: 'error',
                text: 'Error updating matching preferences'
            });
            setTimeout(() => setMatchingMessage({ type: '', text: '' }), 4000);
        } finally {
            setIsLoadingMatching(false);
        }
    };

    const handleUpdate = async () => {
        try {
            // Ensure the ID is valid
            if (!userInfo.id_utilisateur) {
                console.error("Cannot update user: Missing ID");
                alert("Error: Missing user ID");
                return;
            }

            // Convert id_utilisateur to string to ensure it matches the expected type
            await updateUser(String(userInfo.id_utilisateur), userInfo);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Update error:", err);
            alert("Error updating profile");
        }
    };
    
    // Add an interest to the user
    const handleAddInteret = async (nomInteret: string, intensite?: number, categorie?: string) => {
        if (!userInfo.id_utilisateur || !nomInteret.trim()) return;
        
        const finalIntensity = intensite || newInteretIntensity;
        
        console.log('🎯 Adding interest with details:', {
            userId: userInfo.id_utilisateur,
            interest: nomInteret,
            intensity: finalIntensity,
            category: categorie || 'Manual'
        });
        
        try {
            const response = await interetService.addInteret(userInfo.id_utilisateur, nomInteret, finalIntensity, categorie);
            console.log('✅ Interest added successfully:', response.data);
            
            fetchUserInterets(userInfo.id_utilisateur); // Refresh the user's interests list
            setNewInteret(''); // Reset the input field
            setNewInteretIntensity(3); // Reset intensity to default
            setInteretsMessage({ type: 'success', text: `Interest added with intensity ${finalIntensity}/5!` });
            setTimeout(() => setInteretsMessage({ type: '', text: '' }), 3000);
        } catch (error: any) {
            console.error("❌ Error adding interest:", error);
            console.error("Error details:", error.response?.data);
            
            // Check if it's a duplicate interest error (status code 409)
            if (error.response && error.response.status === 409) {
                setInteretsMessage({ 
                    type: 'warning', 
                    text: 'You already have this interest in your profile.' 
                });
            } else {
                setInteretsMessage({ type: 'error', text: 'Error adding interest' });
            }
            
            setTimeout(() => setInteretsMessage({ type: '', text: '' }), 3000);
        }
    };

    // Remove an interest from the user
    const handleRemoveInteret = async (interetId: string) => {
        if (!interetId) return;
        
        try {
            await interetService.removeInteret(interetId);
            fetchUserInterets(userInfo.id_utilisateur); // Refresh user's interests list
            setInteretsMessage({ type: 'success', text: 'Interest removed successfully!' });
            setTimeout(() => setInteretsMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error("Error removing interest:", error);
            setInteretsMessage({ type: 'error', text: 'Error removing interest' });
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <Card className="max-w-2xl mx-auto mt-10 p-4">
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="profil">
                    <TabsList className="mb-4">
                        <TabsTrigger value="profil">Profile</TabsTrigger>
                        <TabsTrigger value="interests">Center of Interests</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profil">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="nom">Last Name</Label>
                                <Input id="nom" value={userInfo.nom} onChange={(e) => setUserInfo({ ...userInfo, nom: e.target.value })} placeholder="Doe" />
                            </div>
                            <div>
                                <Label htmlFor="prenom">First Name</Label>
                                <Input id="prenom" value={userInfo.prenom} onChange={(e) => setUserInfo({ ...userInfo, prenom: e.target.value })} placeholder="John" />
                            </div>
                            <div>
                                <Label htmlFor="mail">Email Address</Label>
                                <Input id="mail" type="email" value={userInfo.mail} onChange={(e) => setUserInfo({ ...userInfo, mail: e.target.value })} placeholder="john.doe@example.com" />
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
                                <Label htmlFor="notification">Notifications</Label>
                                <Switch id="notification" checked={userInfo.notification} onCheckedChange={(value) => setUserInfo({ ...userInfo, notification: value })} />
                            </div>
                            <div>
                                <Label htmlFor="langue">Language</Label>
                                <Select value={userInfo.langue} onValueChange={(value) => setUserInfo({ ...userInfo, langue: value })}>
                                    <SelectTrigger id="langue">
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-4" onClick={handleUpdate}>Save Settings</Button>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="interests">
                        <div className="space-y-6">
                            {/* Section Social Matching Toggle */}
                            <Card className={`${matchingEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Users className={`h-5 w-5 ${matchingEnabled ? 'text-green-600' : 'text-red-600'}`} />
                                            <div>
                                                <h4 className="font-medium text-slate-900">Social Matching</h4>
                                                <p className={`text-sm ${matchingEnabled ? 'text-green-700' : 'text-red-700'}`}>
                                                    {matchingEnabled 
                                                        ? "You can be matched with other users for shared dining experiences"
                                                        : "Not active - enable to allow matching with other users"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {isLoadingMatching && (
                                                <Loader2 className={`h-4 w-4 animate-spin ${matchingEnabled ? 'text-green-600' : 'text-red-600'}`} />
                                            )}
                                            <Switch 
                                                checked={matchingEnabled}
                                                onCheckedChange={handleToggleMatching}
                                                disabled={isLoadingMatching}
                                                className={matchingEnabled ? "data-[state=checked]:bg-green-600" : ""}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Message de statut du matching */}
                                    {matchingMessage.text && (
                                        <div className={`mt-3 p-3 rounded-md text-sm ${matchingEnabled 
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                            {matchingMessage.text}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Section des intérêts de l'utilisateur */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Your Interests</h3>
                                {isLoadingInterets ? (
                                    <div className="flex items-center justify-center p-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : userInterets.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {userInterets
                                            .filter(interet => interet.nom_interet !== 'MATCHING_ENABLED')
                                            .map((interet) => (
                                                <div 
                                                    key={interet.id_interet} 
                                                    className="flex items-center bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full"
                                                >
                                                    <span>{interet.nom_interet}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 ml-1 hover:bg-secondary-foreground/10"
                                                        onClick={() => handleRemoveInteret(interet.id_interet)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
                                        No interests selected yet. Add some below to improve restaurant matching.
                                    </div>
                                )}
                            </div>

                            {/* Section pour ajouter des intérêts */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Add New Interests</h3>
                                
                                {/* Status message */}
                                {interetsMessage.text && (
                                    <div className={`mb-3 p-3 rounded-md text-sm ${interetsMessage.type === 'success' 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : interetsMessage.type === 'warning'
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                        {interetsMessage.text}
                                    </div>
                                )}

                                {/* Champ pour ajouter un nouvel intérêt */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Enter a new interest"
                                            value={newInteret}
                                            onChange={(e) => setNewInteret(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button 
                                            onClick={() => handleAddInteret(newInteret)}
                                            disabled={!newInteret.trim()}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>
                                    
                                    {/* Intensity Selector */}
                                    <div className="flex items-center gap-4 px-2">
                                        <Label className="text-sm font-medium min-w-fit">Interest Level:</Label>
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-xs text-muted-foreground">Low</span>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setNewInteretIntensity(level)}
                                                        className={`w-8 h-8 rounded-full border-2 text-xs font-medium transition-all ${
                                                            newInteretIntensity >= level
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'bg-background border-muted-foreground/30 hover:border-muted-foreground/50'
                                                        }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="text-xs text-muted-foreground">High</span>
                                            <span className="text-sm font-medium text-primary ml-2">
                                                {newInteretIntensity}/5
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Catégories d'intérêts */}
                                {Object.keys(suggestedInterets).length > 0 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Categories</h4>
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {Object.keys(suggestedInterets).map((category) => (
                                                    <Button 
                                                        key={category}
                                                        variant={activeCategory === category ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setActiveCategory(category)}
                                                        className="rounded-full"
                                                    >
                                                        {category}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Affichage des intérêts de la catégorie sélectionnée */}
                                        {activeCategory && suggestedInterets[activeCategory] && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 text-primary">{activeCategory} Interests</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestedInterets[activeCategory].map((interet, index) => (
                                                        <Button
                                                            key={`${activeCategory}-${index}`}
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleAddInteret(interet, newInteretIntensity, activeCategory)}
                                                            className="rounded-full"
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            {interet}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
