import { db, auth } from '../firebase-config.js';
import { 
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp, increment, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const COLLECTION_NAME = 'prompts';

export class PromptsService {
    async getPrompts(filters = {}) {
        try {
            let q = collection(db, COLLECTION_NAME);
            
            // Single query condition to prevent missing composite index errors
            q = query(q, where("status", "==", "published"), limit(100));
            const querySnapshot = await getDocs(q);
            
            let results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side filtering
            if (filters.category && filters.category !== 'All') {
                results = results.filter(p => p.category === filters.category);
            }

            // Client-side sorting
            const sortBy = filters.sort || 'newest';
            if (sortBy === 'newest') {
                results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            } else if (sortBy === 'top') {
                results.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
            }

            return results;
        } catch (error) {
            console.error("Error fetching prompts:", error);
            return [];
        }
    }

    async getPromptById(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                // Increment view count passively (fire and forget)
                updateDoc(docRef, { views: increment(1) }).catch(e => console.error("View inc error", e));
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching prompt:", error);
            return null;
        }
    }

    async createPrompt(promptData) {
        if (!auth.currentUser) throw new Error('Must be logged in to create a prompt');
        
        try {
            // Extract variables from content [VARIABLE_NAME]
            const variableRegex = /\[([A-Z0-9_]+)\]/g;
            const matches = [...promptData.content.matchAll(variableRegex)];
            const variables = [...new Set(matches.map(m => m[1]))].map(name => ({
                name,
                placeholder: name.toLowerCase().replace('_', ' '),
                description: ''
            }));

            const docData = {
                ...promptData,
                authorId: auth.currentUser.uid,
                authorUsername: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                variables,
                upvotes: 0,
                upvotedBy: [],
                views: 0,
                status: 'published',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            
            // Add reputation to user (mocking this here for MVP)
            // In a real app this would be a cloud function to prevent tampering
            return docRef.id;
        } catch (error) {
            console.error("Error creating prompt:", error);
            throw error;
        }
    }

    async toggleUpvote(id) {
        if (!auth.currentUser) throw new Error('Must be logged in to upvote');
        
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Prompt not found");
            
            const data = snap.data();
            const upvotedBy = data.upvotedBy || [];
            const hasUpvoted = upvotedBy.includes(auth.currentUser.uid);

            if (hasUpvoted) {
                // Remove upvote
                await updateDoc(docRef, {
                    upvotedBy: arrayRemove(auth.currentUser.uid),
                    upvotes: increment(-1)
                });
                return { hasUpvoted: false, newCount: (data.upvotes || 1) - 1 };
            } else {
                // Add upvote
                await updateDoc(docRef, {
                    upvotedBy: arrayUnion(auth.currentUser.uid),
                    upvotes: increment(1)
                });
                return { hasUpvoted: true, newCount: (data.upvotes || 0) + 1 };
            }
        } catch (error) {
            console.error("Error toggling upvote:", error);
            throw error;
        }
    }

    async deletePrompt(id, authorId) {
        if (!auth.currentUser) throw new Error('Must be logged in to delete');
        const isAdmin = auth.currentUser.email === 'beyneymen10@gmail.com';
        if (!isAdmin && auth.currentUser.uid !== authorId) throw new Error('Not authorized to delete this prompt');

        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            return true;
        } catch (error) {
            console.error("Error deleting prompt:", error);
            throw error;
        }
    }
}

export const promptsService = new PromptsService();
