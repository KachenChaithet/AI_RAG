import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";



export function useLogout() {
    const router = useRouter()

    return useMutation({
        mutationFn: () => axios.post("http://localhost:8000/logout", {}, { withCredentials: true }),
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
        mutationFn: (body: LoginBody) => axios.post("http://localhost:8000/login", { email: body.email, password: body.password }, { withCredentials: true }),
        onSuccess: () => {
            router.push("/")
        }
    })
}