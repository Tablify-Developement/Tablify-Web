"use client";

import { useEffect, useState } from 'react';
import { fetchTest } from '@/services/test'; // Adjust the import path as necessary

function Home() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        const getMessage = async () => {
            try {
                const data = await fetchTest();
                setMessage(data.message);
            } catch (error) {
                console.error('Failed to fetch message:', error);
                setMessage('Failed to load message from backend.');
            }
        };

        getMessage();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold underline">
                Hello, World!
            </h1>
            <p>Backend says: {message}</p>
        </div>
    );
}

export default Home;