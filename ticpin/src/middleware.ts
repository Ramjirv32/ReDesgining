import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
    '/profile',
    '/my-pass',
    '/bookings',
    '/logout',
];

const ADMIN_ROUTES = [
    '/admin'
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Check if the route is protected
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAdminProtected = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    // Get the user session cookie
    const userSession = request.cookies.get('ticpin_user_session');
    
    // Auth logic
    if (isProtected && !userSession) {
        // Redirect to homepage if not logged in
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (isAdminProtected) {
        // Exclude /admin/login from protection
        if (pathname === '/admin/login') {
            return NextResponse.next();
        }

        // Try checking organizer session first
        const orgSession = request.cookies.get('ticpin_session');
        if (orgSession) {
            try {
                const raw = orgSession.value;
                const json = atob(raw);
                const session = JSON.parse(json);
                if (session.isAdmin === true) {
                    return NextResponse.next();
                }
            } catch { /* ignore */ }
        }

        // Fallback to user phone check for legacy admin
        if (userSession) {
            try {
                const raw = userSession.value;
                const json = atob(raw);
                const session = JSON.parse(json);
                if (session.phone === '6383667872') {
                    return NextResponse.next();
                }
            } catch { /* ignore */ }
        }

        // If neither check passed, redirect to root
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Only apply middleware to relevant routes
    matcher: ['/profile/:path*', '/admin/:path*', '/my-pass/:path*', '/logout/:path*'],
};
