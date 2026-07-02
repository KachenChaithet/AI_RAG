"use client"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { useDeleteSession, useSessions } from "@/hooks/useSession"
import { ChevronDown, ChevronRight, EllipsisVertical, FileText, Folder, LogOut, MessageCircle, Pen, Plus, Search, Settings, SlidersVertical, Trash, User } from "lucide-react"
import { useState } from "react"
import { ModeToggle } from "./ModeToggle"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLogout } from "@/hooks/useAuth"
import DropdownSettting from "./DropdownSettting"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSearchStore } from "../stores/useSearchStore"
import { useUser } from "@/providers/UserProvider"

export function AppSidebar() {
    const { open } = useSidebar()

    const [sortUser, setSortUser] = useState<"none" | "date" | "project">("none")
    const [sortAdmin, setSortAdmin] = useState<"none" | "date" | "project">("none")

    const { data: userSession, isLoading, isError } = useSessions(undefined, undefined, undefined, 'user', sortUser)
    const { data: adminSession } = useSessions(undefined, undefined, undefined, 'admin', sortAdmin)

    const { user } = useUser()
    const [openRecents, setOpenRecents] = useState(true)
    const [openRecentsAdmin, setOpenRecentsAdmin] = useState(true)
    const { mutate: mutateLogout, isPending: isLogout } = useLogout()

    const [hoverRecents, setHoverRecents] = useState(false)

    const { setOpen } = useSearchStore()
    const pathname = usePathname()

    const router = useRouter()


    return (
        <>
            <Sidebar collapsible="icon">
                <SidebarHeader className=" flex items-center justify-between ">
                    {open ? (
                        <>
                            <p className="select-none">icon</p>
                            <div className="flex items-center">
                                <SidebarTrigger />
                                <button onClick={() => setOpen(true)}>
                                    <Search className="size-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <SidebarTrigger />
                    )
                    }

                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push("/")} tooltip={"New Chat"}>
                                    <Plus className="size-4" />
                                    <p>New chat</p>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push("/admin")} tooltip={"New Chat"}>
                                    <Plus className="size-4" />
                                    <p>New admin chat</p>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip={"Chats"} onClick={() => router.push("/recents")}>
                                    <MessageCircle className="size-4" />
                                    <p>Chats</p>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip={"Projects"} onClick={() => router.push("/projects")}>
                                    <Folder className="size-4" />
                                    <p>Project</p>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {user?.role === 'admin' && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton tooltip={"Documents"} onClick={() => router.push("/documents")}>
                                        <FileText className="size-4" />
                                        <p>Documents</p>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}



                        </SidebarMenu>
                    </SidebarGroup>


                    {open && (
                        <SidebarGroup>
                            <Collapsible open={openRecents} onOpenChange={setOpenRecents} className="w-full">
                                <SidebarGroupLabel>
                                    <div className="flex items-center justify-between w-full">
                                        <CollapsibleTrigger asChild>
                                            <p
                                                className="cursor-pointer flex items-center gap-1 group hover:text-muted-foreground select-none"
                                                onMouseEnter={() => setHoverRecents(true)}
                                                onMouseLeave={() => setHoverRecents(false)}
                                            >
                                                Recents
                                                {hoverRecents && (
                                                    openRecents
                                                        ? <ChevronDown className="size-3" />
                                                        : <ChevronRight className="size-3" />
                                                )}
                                            </p>
                                        </CollapsibleTrigger>
                                        {openRecents && (
                                            <DropdownMenu>
                                                <Tooltip>
                                                    <TooltipTrigger>

                                                        <DropdownMenuTrigger asChild >
                                                            <SlidersVertical className="size-4 cursor-pointer" />
                                                        </DropdownMenuTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Group By</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Group by</DropdownMenuLabel>
                                                        <DropdownMenuCheckboxItem
                                                            checked={sortUser === 'none'}
                                                            onCheckedChange={() => setSortUser('none')}
                                                        >
                                                            None
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={sortUser === 'date'}
                                                            onCheckedChange={() => setSortUser('date')}
                                                        >
                                                            Date
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={sortUser === 'project'}
                                                            onCheckedChange={() => setSortUser('project')}
                                                        >
                                                            Project
                                                        </DropdownMenuCheckboxItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <CollapsibleContent>
                                        <SidebarMenu>
                                            {userSession?.map((item) => (
                                                <SidebarMenuItem key={item.id} className="flex items-center">
                                                    <SidebarMenuButton
                                                        onClick={() => router.push(`/chat/${item.id}`)}
                                                        isActive={pathname === `/chat/${item.id}`}
                                                    >
                                                        <span className="truncate ">{item.topic}</span>
                                                    </SidebarMenuButton>
                                                    <DropdownSettting sessionId={item.id} topic={item.topic} key={item.id} asSidebar />
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </CollapsibleContent>
                                </SidebarGroupContent>


                            </Collapsible>
                        </SidebarGroup>
                    )}
                    {open && user?.role === 'admin' && (
                        <SidebarGroup>
                            <Collapsible open={openRecentsAdmin} onOpenChange={setOpenRecentsAdmin} className="w-full">
                                <SidebarGroupLabel>
                                    <div className="flex items-center justify-between w-full">
                                        <CollapsibleTrigger asChild>
                                            <p
                                                className="cursor-pointer flex items-center gap-1 group hover:text-muted-foreground select-none"
                                                onMouseEnter={() => setHoverRecents(true)}
                                                onMouseLeave={() => setHoverRecents(false)}
                                            >
                                                Admin Recents
                                                {hoverRecents && (
                                                    openRecents
                                                        ? <ChevronDown className="size-3" />
                                                        : <ChevronRight className="size-3" />
                                                )}
                                            </p>
                                        </CollapsibleTrigger>
                                        {openRecents && (
                                            <DropdownMenu>
                                                <Tooltip>
                                                    <TooltipTrigger>

                                                        <DropdownMenuTrigger asChild >
                                                            <SlidersVertical className="size-4 cursor-pointer" />
                                                        </DropdownMenuTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Group By</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Group by</DropdownMenuLabel>
                                                        <DropdownMenuCheckboxItem
                                                            checked={sortAdmin === 'none'}
                                                            onCheckedChange={() => setSortAdmin('none')}
                                                        >
                                                            None
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={sortAdmin === 'date'}
                                                            onCheckedChange={() => setSortAdmin('date')}
                                                        >
                                                            Date
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={sortAdmin === 'project'}
                                                            onCheckedChange={() => setSortAdmin('project')}
                                                        >
                                                            Project
                                                        </DropdownMenuCheckboxItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <CollapsibleContent>
                                        <SidebarMenu>
                                            {adminSession?.map((item) => (
                                                <SidebarMenuItem key={item.id} className="flex items-center">
                                                    <SidebarMenuButton
                                                        onClick={() => router.push(`/admin/chat/${item.id}`)}
                                                        isActive={pathname === `/admin/chat/${item.id}`}
                                                    >
                                                        <span className="truncate">{item.topic}</span>
                                                    </SidebarMenuButton>
                                                    <DropdownSettting sessionId={item.id} topic={item.topic} key={item.id} asSidebar />
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </CollapsibleContent>
                                </SidebarGroupContent>
                            </Collapsible>
                        </SidebarGroup>
                    )}

                </SidebarContent>
                <SidebarFooter className={` bg-muted shadow-md`}>
                    <SidebarMenu >
                        <SidebarMenuItem className={`${open && 'flex items-center gap-2 '}`} >
                            <DropdownMenu >
                                <DropdownMenuTrigger className="w-full" asChild>

                                    <SidebarMenuButton
                                        className={open ? "h-auto py-2  " : "justify-center p-2 "}
                                        onClick={() => console.log("setting")}
                                    >
                                        <Avatar>
                                            <AvatarImage src="" />
                                            <AvatarFallback>KC</AvatarFallback>
                                        </Avatar>

                                        {open && (
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-medium leading-tight">
                                                    kachen
                                                </span>

                                                <span className="text-xs text-muted-foreground leading-tight">
                                                    user
                                                </span>
                                            </div>
                                        )}
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="start" className="w-60">
                                    <DropdownMenuItem>
                                        <Settings className="size-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <ModeToggle />
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={() => mutateLogout()} disabled={isLogout}>
                                        <LogOut className="size-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>

            </Sidebar >
        </>
    )
}
