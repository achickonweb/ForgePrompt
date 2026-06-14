import { db, auth } from '../firebase-config.js';
import { 
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { usersService } from './users-service.js';

const REQUESTS_COL = 'requests';
const SUBMISSIONS_COL = 'request_submissions';

export class RequestsService {
    async getRequests(status = 'open') {
        try {
            const q = query(
                collection(db, REQUESTS_COL),
                where("status", "==", status)
            );
            const snap = await getDocs(q);
            let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Sort in memory to avoid needing a Firestore composite index
            results.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            
            return results;
        } catch (error) {
            console.error("Error fetching requests:", error);
            return [];
        }
    }

    async getRequestById(id) {
        try {
            const docRef = doc(db, REQUESTS_COL, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                // Increment view passive
                updateDoc(docRef, { viewCount: increment(1) }).catch(() => {});
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching request:", error);
            return null;
        }
    }

    async createRequest(data) {
        if (!auth.currentUser) throw new Error("Login required");
        try {
            const docData = {
                ...data,
                authorId: auth.currentUser.uid,
                authorUsername: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                submissionCount: 0,
                viewCount: 0,
                status: 'open',
                acceptedSubmissionId: null,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, REQUESTS_COL), docData);
            return docRef.id;
        } catch (error) {
            console.error("Error creating request:", error);
            throw error;
        }
    }

    async getSubmissionsForRequest(reqId) {
        try {
            const q = query(
                collection(db, SUBMISSIONS_COL),
                where("requestId", "==", reqId),
                orderBy("upvotes", "desc") // Best submissions first
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error("Error fetching submissions:", error);
            return [];
        }
    }

    async submitSolution(reqId, promptContent, explanation) {
        if (!auth.currentUser) throw new Error("Login required");
        try {
            const docData = {
                requestId: reqId,
                promptContent,
                explanation,
                authorId: auth.currentUser.uid,
                authorUsername: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                upvotes: 0,
                isWinner: false,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, SUBMISSIONS_COL), docData);
            
            // Increment submission count on request
            await updateDoc(doc(db, REQUESTS_COL, reqId), {
                submissionCount: increment(1)
            });

            // Reward for submitting (+5 points)
            await usersService.addReputation(auth.currentUser.uid, 5);

            return docRef.id;
        } catch (error) {
            console.error("Error submitting solution:", error);
            throw error;
        }
    }

    async markWinner(reqId, submissionId, submissionAuthorId) {
        if (!auth.currentUser) throw new Error("Login required");
        try {
            // Mark request as solved
            await updateDoc(doc(db, REQUESTS_COL, reqId), {
                status: 'solved',
                acceptedSubmissionId: submissionId
            });

            // Mark submission as winner
            await updateDoc(doc(db, SUBMISSIONS_COL, submissionId), {
                isWinner: true
            });

            // Huge reward for winning (+50 points)
            await usersService.addReputation(submissionAuthorId, 50);

            return true;
        } catch (error) {
            console.error("Error marking winner:", error);
            throw error;
        }
    }

    async deleteRequest(id, authorId) {
        if (!auth.currentUser) throw new Error('Must be logged in to delete');
        const isAdmin = auth.currentUser.email === 'beyneymen10@gmail.com';
        if (!isAdmin && auth.currentUser.uid !== authorId) throw new Error('Not authorized to delete this request');

        try {
            await deleteDoc(doc(db, REQUESTS_COL, id));
            return true;
        } catch (error) {
            console.error("Error deleting request:", error);
            throw error;
        }
    }

    async deleteSubmission(submissionId, requestId, authorId) {
        if (!auth.currentUser) throw new Error('Must be logged in to delete');
        const isAdmin = auth.currentUser.email === 'beyneymen10@gmail.com';
        if (!isAdmin && auth.currentUser.uid !== authorId) throw new Error('Not authorized to delete this submission');

        try {
            await deleteDoc(doc(db, SUBMISSIONS_COL, submissionId));
            
            // Decrement submission count on request
            await updateDoc(doc(db, REQUESTS_COL, requestId), {
                submissionCount: increment(-1)
            });
            
            return true;
        } catch (error) {
            console.error("Error deleting submission:", error);
            throw error;
        }
    }

    async getUserRequests(userId) {
        try {
            const q = query(
                collection(db, REQUESTS_COL),
                where("authorId", "==", userId)
            );
            const snap = await getDocs(q);
            let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Sort in memory to avoid needing a Firestore composite index
            results.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            
            return results;
        } catch (error) {
            console.error("Error fetching user requests:", error);
            return [];
        }
    }
}

export const requestsService = new RequestsService();
