// Universal clear all function for complete logout
export function clearAllData(): void {
    if (typeof window === 'undefined') return;
    
    // Clear ALL cookies (including HttpOnly tokens via backend calls)
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
            document.cookie = `${name}=; path=/; Max-Age=-1`;
            document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; Max-Age=-1`;
            document.cookie = `${name}=; path=/; domain=${window.location.hostname}; Max-Age=-1`;
        }
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB
    if (window.indexedDB) {
        const databases = indexedDB.databases();
        databases.then(dbs => {
            dbs.forEach(db => {
                if (db.name) indexedDB.deleteDatabase(db.name);
            });
        });
    }
    
    // Clear service workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
        });
    }
    
    // Clear cache storage
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
    }
    
    // Dispatch events to update UI
    window.dispatchEvent(new Event('user-auth-change'));
    window.dispatchEvent(new Event('organizer-auth-change'));
    
    // Force reload to clear any in-memory state
    setTimeout(() => {
        window.location.href = '/';
    }, 100);
}
