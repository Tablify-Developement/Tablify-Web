// File: src/components/Admin/debug.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

export default function AdminDebug() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState<string>('');
    const { user } = useAuth();

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'tablify-web-n6fn.onrender.com/api';

    const testEndpoint = async (name: string, url: string, method = 'GET') => {
        setLoading(name);
        const token = localStorage.getItem('authToken');

        try {
            console.log(`Testing ${name}: ${url}`);
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseText = await response.text();
            let responseData;

            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }

            setResults((prev: any) => ({
                ...prev,
                [name]: {
                    status: response.status,
                    ok: response.ok,
                    data: responseData,
                    headers: Object.fromEntries(response.headers.entries())
                }
            }));
        } catch (error: any) {
            setResults((prev: any) => ({
                ...prev,
                [name]: {
                    error: error.message,
                    stack: error.stack
                }
            }));
        } finally {
            setLoading('');
        }
    };

    const tests = [
        { name: 'Backend Health', url: `${API_BASE_URL}/health`, method: 'GET' },
        { name: 'Regular Restaurants', url: `${API_BASE_URL}/restaurants`, method: 'GET' },
        { name: 'Admin Users', url: `${API_BASE_URL}/users/admin/all`, method: 'GET' },
        { name: 'Admin Restaurants', url: `${API_BASE_URL}/restaurants/admin/all`, method: 'GET' },
    ];

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Debug Console</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* User Info */}
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Current User Info</h3>
                        <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
                    </div>

                    {/* Token Info */}
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Auth Token</h3>
                        <p className="text-sm">
                            Token exists: {localStorage.getItem('authToken') ? 'Yes' : 'No'}
                        </p>
                        {localStorage.getItem('authToken') && (
                            <p className="text-sm font-mono">
                                Token preview: {localStorage.getItem('authToken')?.substring(0, 50)}...
                            </p>
                        )}
                    </div>

                    {/* Test Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        {tests.map(test => (
                            <Button
                                key={test.name}
                                onClick={() => testEndpoint(test.name, test.url, test.method)}
                                disabled={loading === test.name}
                                variant="outline"
                            >
                                {loading === test.name ? 'Testing...' : `Test ${test.name}`}
                            </Button>
                        ))}
                    </div>

                    {/* Results */}
                    {Object.keys(results).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Test Results</h3>
                            {Object.entries(results).map(([name, result]: [string, any]) => (
                                <div key={name} className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">{name}</h4>
                                    <div className="text-sm">
                                        {result.error ? (
                                            <div className="text-red-600">
                                                <p><strong>Error:</strong> {result.error}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p><strong>Status:</strong> {result.status} ({result.ok ? 'OK' : 'Error'})</p>
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer">Response Data</summary>
                                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                                        {JSON.stringify(result.data, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}