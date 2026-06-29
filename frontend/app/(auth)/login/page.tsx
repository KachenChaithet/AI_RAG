"use client"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/hooks/useAuth"
import { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react"


const page = () => {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { mutate, isError, error } = useLogin()

    const errorMessage = (error as AxiosError<{ detail: string }>)?.response?.data?.detail
        || error?.message
        || "อีเมลหรือรหัสผ่านไม่ถูกต้อง"

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutate({ email: email, password: password })
    }


    return (
        <Card className=" w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                    Enter your email below to longin to your account
                </CardDescription>
                <CardAction>
                    <Button
                        variant={'link'}
                        onClick={() => router.push("/register")}
                    >
                        Sign Up
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                placeholder="Enter your email address"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input
                                id="password"
                                placeholder="Enter a unique password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Field>
                        <FieldError errors={isError ? [{ message: errorMessage }] : []} />
                    </FieldGroup>


                    <Button type="submit" className="w-full">
                        Login
                    </Button>

                </form>
            </CardContent>


        </Card>
    )
}
export default page