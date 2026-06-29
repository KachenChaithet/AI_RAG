"use client";

import { createContext, useContext, useState } from "react";


export type User = {
    user_id: number;
    role: string;
    exp: number;
} | null;

type UserContextType = {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser: User;
}) {
    const [user, setUser] = useState<User>(initialUser);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error("useUser must be used within UserProvider");
    }

    return context;
}