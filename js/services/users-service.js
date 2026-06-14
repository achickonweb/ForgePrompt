import { db, auth } from '../firebase-config.js';
import { 
    doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { promptsService } from './prompts-service.js';

const COLLECTION_NAME = 'users';

export class UsersService {
    async getUserProfile(userId) {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            
            // If viewing own profile and it doesn't exist, create a base one
            if (auth.currentUser && auth.currentUser.uid === userId) {
                return await this.createBaseProfile(userId);
            }
            
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    }

    async createBaseProfile(userId) {
        const baseData = {
            uid: userId,
            username: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            reputation: 0,
            level: 'Novice',
            badges: [],
            promptCount: 0,
            requestsFulfilled: 0,
            requestsWon: 0,
            bookmarkedPromptIds: [],
            joinedAt: new Date()
        };
        
        await setDoc(doc(db, COLLECTION_NAME, userId), baseData);
        return { id: userId, ...baseData };
    }

    async addReputation(userId, points) {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            await updateDoc(docRef, {
                reputation: increment(points)
            });
            // Logic to update levels could go here (Cloud Function is better)
        } catch (error) {
            console.error("Error adding reputation:", error);
        }
    }

    // A utility for user profile page: getting all prompts by a specific user
    async getUserPrompts(userId) {
        try {
            const q = query(collection(db, 'prompts'), where("authorId", "==", userId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching user prompts:", error);
            return [];
        }
    }

    async toggleBookmark(userId, promptId) {
        try {
            const profileRef = doc(db, COLLECTION_NAME, userId);
            const profileSnap = await getDoc(profileRef);
            if (!profileSnap.exists()) throw new Error("Profile not found");
            
            const data = profileSnap.data();
            const bookmarks = data.bookmarkedPromptIds || [];
            const isBookmarked = bookmarks.includes(promptId);

            if (isBookmarked) {
                await updateDoc(profileRef, { bookmarkedPromptIds: arrayRemove(promptId) });
                return false; // Now unbookmarked
            } else {
                await updateDoc(profileRef, { bookmarkedPromptIds: arrayUnion(promptId) });
                return true; // Now bookmarked
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            throw error;
        }
    }

    async getBookmarkedPrompts(userId) {
        try {
            const profile = await this.getUserProfile(userId);
            if (!profile || !profile.bookmarkedPromptIds || profile.bookmarkedPromptIds.length === 0) return [];
            
            // Fetch prompts manually to avoid needing `in` query limits (which maxes at 30 items)
            const prompts = [];
            for (const pId of profile.bookmarkedPromptIds) {
                const p = await promptsService.getPromptById(pId);
                if (p) prompts.push(p);
            }
            return prompts;
        } catch (error) {
            console.error("Error fetching bookmarked prompts:", error);
            return [];
        }
    }
}

export const usersService = new UsersService();
