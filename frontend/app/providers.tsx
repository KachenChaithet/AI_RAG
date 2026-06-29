"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React, { useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip";
import SearchCommand from "./components/SearchCommand";
import { User, UserProvider } from "@/providers/UserProvider";


export function Providers({ children, user }: { children: React.ReactNode, user: User }) {
    const [queryClient] = useState(() => new QueryClient())



    return (
        <>
            <QueryClientProvider client={queryClient}>
                <UserProvider initialUser={user}>

                    <TooltipProvider>
                        {children}
                    </TooltipProvider>
                </UserProvider>
            </QueryClientProvider>
        </>
    )
}