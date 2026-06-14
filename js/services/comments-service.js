import { db, auth } from '../firebase-config.js';
import { 
    collection, doc, deleteDoc, query, where, orderBy, getDocs, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const COLLECTION_NAME = 'comments';

export class CommentsService {
    async getCommentsForTarget(targetId, targetType = 'prompt') {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("targetId", "==", targetId),
                where("targetType", "==", targetType),
                orderBy("createdAt", "asc")
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    }

    async postComment(targetId, targetType, content) {
        if (!auth.currentUser) throw new Error('Must be logged in to comment');
        if (!content || !content.trim()) throw new Error('Comment cannot be empty');
        
        try {
            const docData = {
                targetId,
                targetType,
                content: content.trim(),
                authorId: auth.currentUser.uid,
                authorUsername: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                upvotes: 0,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            return {
                id: docRef.id,
                ...docData,
                createdAt: new Date() // Return immediately without waiting for server response sync
            };
        } catch (error) {
            console.error("Error posting comment:", error);
            throw error;
        }
    }

    async deleteComment(commentId, authorId) {
        if (!auth.currentUser) throw new Error('Must be logged in to delete');
        const isAdmin = auth.currentUser.email === 'beyneymen10@gmail.com';
        if (!isAdmin && auth.currentUser.uid !== authorId) throw new Error('Not authorized to delete this comment');

        try {
            await deleteDoc(doc(db, COLLECTION_NAME, commentId));
            return true;
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    }
}

export const commentsService = new CommentsService();
