import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { rawListeners } from "process";

export interface Document {
    id: number
    filename: string
    chunk_count: number
    total_chars: number
    type: string
    collection: string
    created_at: string
}

export interface DocumentResponse {
    data: Document[]
    total: number
    page: number
    limit: number
}

export interface DocumentStatus {
    total_documents: number
    total_chunks: number
    avg_chunk_size: number

}

export interface DocumentVector {
    status: string
    latency_ms: number
    pgvector_version: string
}

export function useDocuments(search = "", collection = "", page = 1, type = "") {
    return useQuery<DocumentResponse>({
        queryKey: ["documents", search, collection, page, type],
        queryFn: () => axios.get("http://localhost:8000/document", { params: { search, collection, page, type }, withCredentials: true },).then(r => r.data)
    })
}

export function useUploadDocumentsFiles() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (files: File[]) => {
            const formData = new FormData()
            files.forEach((f) => formData.append("files", f))
            console.log("this is log", formData.getAll("files"));

            const res = await axios.post("http://localhost:8000/document/pdf", formData)
            return res.data
        },
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ["documents"] })
            queryClient.invalidateQueries({ queryKey: ["dashbord", "stats"] })

        },
    })
}

export function useUploadDocumentsText() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ text, filename }: { text: string, filename: string }) => {
            return axios.post("http://localhost:8000/document/text", {
                text: text,
                filename: filename
            }).then(r => r.data)

        },
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ["documents"] })
            queryClient.invalidateQueries({ queryKey: ["dashbord", "stats"] })

        },
    })
}

export function useDeleteDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (documentId: number) =>
            axios.delete(`http://localhost:8000/document/${documentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] })
            queryClient.invalidateQueries({ queryKey: ["dashbord", "stats"] })
        }
    })
}

export function useVectorStoreHealth() {
    return useQuery<DocumentVector>({
        queryKey: ["health", "vector_store"],
        queryFn: () => axios.get("http://localhost:8000/health/vector-store").then(r => r.data),
        refetchInterval: 30000
    })
}

export function useDocumentStatus() {
    return useQuery<DocumentStatus>({
        queryKey: ["dashbord", "stats"],
        queryFn: () => axios.get("http://localhost:8000/dashboard/stats", {
            withCredentials: true
        }).then(r => r.data)
    })
}

export function useUpdateFilename() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ documentId, filename }: { documentId: number, filename: string }) =>
            axios.put(`http://localhost:8000/document/text/${documentId}`, {
                filename: filename
            }),
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ["documents"] })
        },
    })
}

export function useDocumentSearch() {
    return useMutation({
        mutationFn: async ({ text, onChunk, onSources }: {
            text: string
            onChunk: (fullText: string) => void
            onSources: (soures: string[]) => void
        }) => {
            const response = await fetch("http://localhost:8000/document/search", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
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
                            if (parsed.type === "sources") {
                                onSources(parsed.content)
                            } else if (parsed.type === "content") {
                                fullText += parsed.content
                                onChunk(fullText)
                            }
                        } catch { }
                    }
                }
            }

            return fullText


        }
    })
}