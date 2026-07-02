import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FUNCTIONS_CONFIG_MANIFEST } from "next/dist/shared/lib/constants";

interface Projects {
    id: number
    user_id: number
    name: string
    created_at: string
}

export function useProjects() {
    return useQuery<Projects[]>({
        queryKey: ["projects"],
        queryFn: async () => {
            return api.get(`/project`).then(r => r.data)
        }
    })
}

export function useCreateProject() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (name: string) =>
            api.post("/project", {
                name: name
            }),
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
        },
    })
}