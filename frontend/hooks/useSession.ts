import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";


interface Session {
    id: number
    user_id: number
    topic: string
    created_at: string
}

interface Message {
    id: number
    role: string
    text: string
    created_at: string
}






export function useSessions(limit = 20, offset = 0, search?: string, type: "user" | "admin" = "user", group_by: "none" | "date" | "project" = "none", options?: { enabled?: boolean }) {
    return useQuery<Session[] | undefined>({
        queryKey: ["sessions", type, limit, offset, search, group_by],
        queryFn: () => api.get("/session/user", {
            withCredentials: true,
            params: {
                limit,
                offset,
                search,
                type,
                group_by
            }
        }).then(r => r.data),
        enabled: options?.enabled ?? true
    })
}

export function useSession(sessionId: number) {
    return useQuery<Session | undefined>({
        queryKey: ["session", sessionId],
        queryFn: () => api.get(`/session/${sessionId}`,
            {
                withCredentials: true
            }
        )
            .then(r => r.data)
    })
}

export function useMessage(sessionId: number) {
    return useQuery<Message[] | undefined>({
        queryKey: ["message", sessionId],
        queryFn: () =>
            api
                .get(`/session/${sessionId}/message`,
                    {
                        withCredentials: true
                    }
                )
                .then(r => r.data),
        enabled: !!sessionId
    })
}

export function useDeleteSession() {
    const queryClient = useQueryClient()
    const router = useRouter()
    return useMutation({
        mutationFn: (sessionId: number) =>
            api
                .delete(`/session/${sessionId}`, {
                    withCredentials: true
                })
                .then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] })
            router.push("/")
        }
    })
}

export function useDeleteSessions() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (sessionIds: number[]) =>
            api.delete(`/session`, {
                data: { session_ids: sessionIds },
                withCredentials: true
            }).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] })
        }
    })
}

export function useUpdateSession() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ sessionId, topic }: { sessionId: number, topic: string }) =>
            api
                .put(`/session/${sessionId}`, { topic }, {
                    withCredentials: true
                })
                .then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] })
        }
    })
}

