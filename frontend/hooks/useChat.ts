
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ChatBody {
    text: string
    session_id?: number | null
}

export function useChat() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ text, session_id, onChunk }: {
            text: string
            session_id: number
            onChunk: (fullText: string) => void
        }) => {
            const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, session_id })
            })

            const reader = response.body?.getReader()
            if (!reader) throw new Error("no reader")

            const decoder = new TextDecoder()
            let buffer = ""
            let fullText = ""

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
                            if (parsed.type === "content") {
                                fullText += parsed.content
                                onChunk(fullText)
                            }
                        } catch { }
                    }
                }
            }

            return { session_id, fullText }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["message", data.session_id] })
            queryClient.invalidateQueries({ queryKey: ["sessions"] })
        }
    })
}

export function useAdminChat() {
    const queryClient = useQueryClient()
    const router = useRouter()
    return useMutation({
        mutationFn: async ({ text, session_id, onChunk }: {
            text: string,
            session_id: number,
            onChunk: (fullText: string) => void
        }) => {
            const response = await fetch("http://localhost:8000/admin/chat", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, session_id, role: "admin" })
            })

            const reader = response.body?.getReader()
            if (!reader) throw new Error("no reader")

            const decoder = new TextDecoder()
            let buffer = ""
            let fullText = ""

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

                            if (parsed.type === "content") {
                                fullText += parsed.content
                                onChunk(fullText)
                            }
                        } catch { }
                    }
                }
            }
            return { session_id, fullText }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["message", data.session_id] })
            queryClient.invalidateQueries({ queryKey: ["sessions"] })
        }
    })
}