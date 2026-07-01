"use client"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Providers } from "../providers"
import { AppSidebar } from "../components/app-sidebar"
import { ThemeProvider } from "../components/theme-provider"
import SearchCommand from "../components/SearchCommand"

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="h-screen overflow-hidden flex ">
            <SearchCommand />


            <SidebarProvider className="flex h-full">
                <AppSidebar />
                <SidebarInset className="flex flex-col flex-1 overflow-hidden">

                    <main className="flex-1 overflow-auto p-4 h-full">
                        <SidebarTrigger className="md:hidden block" />
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>

        </div>
    )
}

export default Layout