import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";


const publicRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isPublicRoute = publicRoutes.includes(pathname);

    const token = request.cookies.get("token")?.value;

    if (!token) { // ถ้าไม่มี token 
        if (!isPublicRoute) { // ถ้ามันเป็น paht /login หรือ /register ถ้า ไม่เป็น login register
            return NextResponse.redirect(
                new URL("/login", request.url)
            );
        }

        return NextResponse.next();
    }

    try {
        await jwtVerify(
            token,
            new TextEncoder().encode(process.env.SECRET_KEY)
        )


        if (isPublicRoute) {
            return NextResponse.redirect(
                new URL("/", request.url)
            )
        }

        return NextResponse.next();
    } catch (error) {
        const response = NextResponse.redirect(
            new URL("/login", request.url)
        )

        response.cookies.delete("token")

        return response
    }

}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};