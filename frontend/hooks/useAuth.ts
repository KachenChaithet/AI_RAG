import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";



export function useLogout() {
    const router = useRouter()

    return useMutation({
        mutationFn: () => api.post("/logout", {}, { withCredentials: true }),
        onSuccess: () => {
            router.push("/login")
        }
    })
}

interface LoginBody {
    email: string
    password: string
}

export function useLogin() {
    const router = useRouter()

    return useMutation({
        mutationFn: (body: LoginBody) => api.post("/login", { email: body.email, password: body.password }, { withCredentials: true }),
        onSuccess: () => {
            router.push("/")
        }
    })
}