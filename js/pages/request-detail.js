import { requestsService } from '../services/requests-service.js';

let currentRequest = null;
let currentSubmissions = [];

export async function render() {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const id = urlParams.get('id');

    if (!id) return `<div class="section"><p class="status-error">No request ID provided</p></div>`;

    currentRequest = await requestsService.getRequestById(id);
    if (!currentRequest) {
        return `<div class="empty-state"><h3>Request Not Found</h3><p>It may have been deleted.</p></div>`;
    }

    currentSubmissions = await requestsService.getSubmissionsForRequest(id);

    const isAuthor = window.app.authManager.user?.uid === currentRequest.authorId;
    const canDeleteRequest = isAuthor || window.app.authManager.isAdmin;
    const isOpen = currentRequest.status === 'open';

    return `
    <div class="section" style="padding-top: 40px;">
        <a href="/requests" class="back-link">← Back to requests</a>
        
        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); margin-top: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h1 class="page-title" style="text-align: left; font-size: 1.8rem; margin-bottom: 12px;">${currentRequest.title}</h1>
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <span class="cat-badge" data-cat="${currentRequest.category}">${currentRequest.category}</span>
                        ${currentRequest.targetModel ? `<span class="tag">🤖 ${currentRequest.targetModel}</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; min-width: 120px;">
                    <div style="background: var(--bg3); padding: 12px; border-radius: var(--radius); text-align: center;">
                        <div style="font-family: var(--font-mono); font-size: 1.5rem; color: var(--accent);">${currentRequest.submissionCount}</div>
                        <div style="font-size: .7rem; color: var(--text-muted); text-transform: uppercase;">Submissions</div>
                    </div>
                    ${canDeleteRequest ? `
                    <button class="btn-ghost" onclick="window.app.deleteCurrentRequest()" style="width: 100%; padding: 8px; font-size: .8rem; border-color: #ef4444; color: #ef4444;">
                        🗑 Delete Request
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="md-content" style="background: var(--bg2); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border); font-size: .95rem; line-height: 1.7; color: var(--text); margin-top: 20px;">
                ${marked.parse(currentRequest.description)}
            </div>
            
            <div style="margin-top: 16px; font-size: .85rem; color: var(--text-dim);">
                Asked by <strong>${currentRequest.authorUsername}</strong> on ${new Date(currentRequest.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
            </div>
        </div>

        <div style="margin-top: 40px;">
            <h2 style="font-size: 1.4rem; margin-bottom: 24px;">${currentSubmissions.length} Answers</h2>
            
            ${currentSubmissions.length > 0 ? currentSubmissions.map(sub => {
                const canDeleteSubmission = window.app.authManager.user?.uid === sub.authorId || window.app.authManager.isAdmin;
                return `
                <div style="display: flex; gap: 16px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--border-hi);">
                    <!-- Upvote column (mocked) -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <button style="background: none; border: none; color: var(--text-dim); font-size: 1.5rem; cursor: pointer;">▲</button>
                        <span style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: bold;">${sub.upvotes}</span>
                        <button style="background: none; border: none; color: var(--text-dim); font-size: 1.5rem; cursor: pointer;">▼</button>
                        
                        ${sub.isWinner ? `
                            <div style="color: var(--accent); font-size: 2rem; margin-top: 12px;" title="Accepted Answer">✓</div>
                        ` : ''}
                        
                        ${!sub.isWinner && isOpen && isAuthor ? `
                            <button onclick="window.app.acceptSubmission('${sub.id}', '${sub.authorId}')" style="margin-top: 12px; background: none; border: 1px solid var(--accent); color: var(--accent); padding: 4px 8px; border-radius: 4px; font-size: .7rem; font-weight: bold;">Accept</button>
                        ` : ''}
                    </div>

                    <!-- Content -->
                    <div style="flex: 1;">
                        <div style="background: var(--bg3); padding: 20px; border-radius: var(--radius); border: 1px solid var(--border); font-family: var(--font-mono); font-size: .85rem; color: var(--text); white-space: pre-wrap; margin-bottom: 16px;">${sub.promptContent}</div>
                        
                        ${sub.explanation ? `
                            <div class="md-content" style="font-size: .9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
                                <strong>Explanation:</strong><br>
                                ${marked.parse(sub.explanation)}
                            </div>
                        ` : ''}
                        
                        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 16px; font-size: .8rem; color: var(--text-dim);">
                            ${canDeleteSubmission ? `
                            <button onclick="window.app.deleteSubmission('${sub.id}', '${sub.authorId}')" style="background: none; border: none; color: #ef4444; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">Delete</button>
                            ` : ''}
                            <div>Answered by <strong>${sub.authorUsername}</strong></div>
                        </div>
                    </div>
                </div>
            `;
            }).join('') : '<p style="color: var(--text-dim);">No answers yet.</p>'}
        </div>

        ${isOpen ? `
        <div style="margin-top: 48px; background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Your Answer</h3>
            <form onsubmit="event.preventDefault(); window.app.submitSolution();">
                <div class="form-group">
                    <label>Prompt Content <span class="required">*</span></label>
                    <textarea id="s_content" required style="min-height: 150px; font-family: var(--font-mono);" placeholder="Write the prompt here..."></textarea>
                </div>
                <div class="form-group">
                    <label>Explanation (Optional)</label>
                    <textarea id="s_explanation" style="min-height: 80px;" placeholder="Why does this prompt work well?"></textarea>
                </div>
                <div class="submit-feedback status-error" id="solError" style="display:none; margin-bottom: 16px;"></div>
                <button type="submit" class="btn-primary" id="solBtn">Post Your Answer</button>
            </form>
        </div>
        ` : `
        <div style="margin-top: 48px; text-align: center; padding: 24px; background: var(--bg3); border-radius: var(--radius); color: var(--text-muted);">
            This request has been marked as solved and is no longer accepting answers.
        </div>
        `}
    </div>
    `;
}

export function init() {
    window.app.deleteCurrentRequest = async () => {
        if (!confirm("Are you sure you want to delete this request? All submissions will be orphaned. This action cannot be undone.")) return;
        try {
            await requestsService.deleteRequest(currentRequest.id, currentRequest.authorId);
            window.app.router.navigate('/requests');
        } catch (error) {
            alert("Error deleting request: " + error.message);
        }
    };

    window.app.submitSolution = async () => {
        if (!window.app.authManager.user) {
            alert('Please log in to submit a prompt.');
            window.app.router.navigate('/login');
            return;
        }

        const content = document.getElementById('s_content').value;
        const explanation = document.getElementById('s_explanation').value;
        const btn = document.getElementById('solBtn');
        const err = document.getElementById('solError');

        btn.disabled = true;
        btn.textContent = 'Posting...';
        err.style.display = 'none';

        try {
            await requestsService.submitSolution(currentRequest.id, content, explanation);
            window.app.router.handleRoute(); // refresh
        } catch (error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Post Your Answer';
        }
    };

    window.app.acceptSubmission = async (subId, authorId) => {
        if (!confirm("Are you sure you want to mark this as the winning answer? This cannot be undone.")) return;
        
        try {
            await requestsService.markWinner(currentRequest.id, subId, authorId);
            window.app.router.handleRoute(); // refresh
        } catch (error) {
            alert("Error accepting answer: " + error.message);
        }
    };

    window.app.deleteSubmission = async (subId, authorId) => {
        if (!confirm("Are you sure you want to delete this answer?")) return;
        try {
            await requestsService.deleteSubmission(subId, currentRequest.id, authorId);
            window.app.router.handleRoute(); // refresh
        } catch (error) {
            alert("Error deleting answer: " + error.message);
        }
    };
}
