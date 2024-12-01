'use client';

import { useRouter } from 'next/navigation';
import styles from './auth.module.css';

export default function AuthPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-lg space-y-4">
                <h1 className="text-3xl font-bold text-center mb-6 text-black">Welcome</h1>
                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/sign-in')}
                        className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => router.push('/sign-up')}
                        className="w-full px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-300 transform hover:scale-105"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}