import { auth } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { renderNavbar } from './components/navbar.js';

export class AuthManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.updateUI();
        });
    }

    get isAdmin() {
        return this.user && this.user.email === 'beyneymen10@gmail.com';
    }

    updateUI() {
        // Re-render navbar with auth state
        document.getElementById('navbar-container').innerHTML = renderNavbar(this.user, this.isAdmin);
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            window.app.router.navigate('/');
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // TODO: Create corresponding Firestore user document
            window.app.router.navigate('/');
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            window.app.router.navigate('/');
        } catch (error) {
            console.error('Logout error', error);
        }
    }
}

// Singleton instance
export const authManager = new AuthManager();
