"use client"
import DropdownSettting from "@/app/components/DropdownSettting"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession, useUpdateSession } from "@/hooks/useSession"
import { ChevronDown } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

const Layout = ({ children }: { children: React.ReactNode }) => {
    const params = useParams()
    const sessionId = Number(params.sessionId)
    const { data, isPending, isError } = useSession(sessionId)
    const [isEditing, setIsEditing] = useState(false)
    const [topic, setTopic] = useState(data?.topic ?? "")

    const { mutate: mutateRename, isPending: isUpdatePending, isError: isUpdateError } = useUpdateSession()

    const handleRename = () => {
        setIsEditing(false)
        if (topic !== data?.topic) {
            mutateRename({ sessionId, topic })
        }
    }
    useEffect(() => {
        if (data?.topic) setTopic(data.topic)
    }, [data?.topic])

    return (
        <div className="h-full flex flex-col ">
            <header className="h-8  shrink-0 text-[#BF0D1D] font-semibold text-sm flex items-center gap-2  ">
                {isEditing ? (
                    <Input
                        autoFocus
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename()
                            if (e.key === "Escape") {
                                setTopic(data?.topic ?? "")
                                setIsEditing(false)
                            }
                        }}
                        className="w-40"
                    />
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        className="cursor-pointer truncate md:block max-w-40 hidden "
                    >
                        {topic}
                    </span>
                )}
                {data && (
                    <DropdownSettting
                        sessionId={data.id}
                        topic={data.topic}
                        icon={ChevronDown}
                        key={data.id}
                        className="md:block hidden"

                    />

                )}
            </header>
            <div className="flex-1 overflow-hidden ">
                {children}
            </div>
        </div>
    )
}

export default Layout