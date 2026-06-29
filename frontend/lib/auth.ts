import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getCurrentUser() {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.SECRET_KEY!)
        );

        return {
            user_id: payload.user_id as number,
            role: payload.role as string,
            exp: payload.exp as number,
        };
    } catch {
        return null;
    }
}