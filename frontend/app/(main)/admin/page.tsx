"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/providers/UserProvider"
import { useQueryClient } from "@tanstack/react-query"
import { Send } from "lucide-react"
import { redirect, useRouter } from "next/navigation"
import { useState } from "react"

const page = () => {
    const [message, setMessage] = useState('')
    const [isPending, setIsPending] = useState(false)
    const { user } = useUser()
    const router = useRouter()
    const queryClient = useQueryClient()

    if (user?.role !== "admin") {
        redirect("/")
    }

    const handleStartChat = async () => {
        if (!message.trim()) return

        setIsPending(true)
        const text = message
        setMessage("")

        const response = await fetch("http://localhost:8000/admin/chat", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, session_id: null, role: "admin" })
        })

        const reader = response.body?.getReader()
        if (!reader) {
            setIsPending(false)
            return
        }

        const decoder = new TextDecoder()
        let buffer = ""
        let newSessionId: number | null = null

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const parsed = JSON.parse(line.slice(6))

                        // ✅ แก้ตรงนี้ — เช็ค type แล้วอ่านจาก content
                        if (parsed.type === "session_id") {
                            newSessionId = Number(parsed.content)
                        }
                    } catch { }
                }
            }
        }

        setIsPending(false)

        if (newSessionId) {
            router.push(`/admin/chat/${newSessionId}`)
        }
        queryClient.invalidateQueries({ queryKey: ["sessions", "admin"] })
    }

    return (
        <div className="flex justify-center items-center flex-col gap-8 flex-1">
            <h1 className="md:text-6xl text-3xl select-none">Welcome to admin ai chat {user.user_id}</h1>
            <div className="md:w-177 w-80 p-4 text-white flex justify-between bg-[#ddc3c3] h-25 rounded-[16px]">
                <Input
                    className="outline-0 border-0 placeholder:text-neutral-700 text-neutral-700 focus-visible:ring-0"
                    placeholder="Write message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleStartChat()
                        }
                    }}
                />
                <div className="flex items-center">
                    <Button
                        className="w-8 h-8 rounded-[8px] bg-[#2182a0] flex items-center justify-center"
                        onClick={handleStartChat}
                        disabled={isPending}
                    >
                        <Send className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
export default page