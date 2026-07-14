import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase/config';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAdmin: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithGitHub: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            setError(err.message || 'Failed to login with Google.');
        } finally {
            setLoading(false);
        }
    };

    const loginWithGitHub = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (err: any) {
            setError(err.message || 'Failed to login with GitHub.');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setError(null);
        try {
            await signOut(auth);
        } catch (err: any) {
            setError(err.message || 'Failed to logout.');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = !!(user && user.email === (import.meta.env.VITE_ADMIN_EMAIL || 'bimasatyamahendra07@gmail.com'));

    return (
        <AuthContext.Provider value={{ user, loading, error, isAdmin, loginWithGoogle, loginWithGitHub, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
