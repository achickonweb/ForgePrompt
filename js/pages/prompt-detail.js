import { promptsService } from '../services/prompts-service.js';
import { commentsService } from '../services/comments-service.js';
import { usersService } from '../services/users-service.js';

let currentPrompt = null;

export async function render() {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const id = urlParams.get('id');

    if (!id) return `<div class="section"><p class="status-error">No prompt ID provided</p></div>`;

    currentPrompt = await promptsService.getPromptById(id);
    const comments = await commentsService.getCommentsForTarget(id, 'prompt');

    if (!currentPrompt) {
        return `
        <div class="empty-state">
            <div class="empty-icon">∅</div>
            <div style="text-align: center; margin-top: 60px;">
                <h3>Prompt not found.</h3>
                <a href="/prompts" class="btn-primary">Browse Prompts</a>
            </div>
        </div>`;
    }

    // Identify variables [VAR_NAME]
    const hasVariables = currentPrompt.variables && currentPrompt.variables.length > 0;
    const isAuthor = window.app.authManager.user?.uid === currentPrompt.authorId;
    const canDeletePrompt = isAuthor || window.app.authManager.isAdmin;
    
    let isBookmarked = false;
    let hasUpvoted = false;
    if (window.app.authManager.user) {
        const profile = await usersService.getUserProfile(window.app.authManager.user.uid);
        isBookmarked = profile?.bookmarkedPromptIds?.includes(currentPrompt.id) || false;
        hasUpvoted = currentPrompt.upvotedBy?.includes(window.app.authManager.user.uid) || false;
    }

    return `
    <div class="section">
        <a href="javascript:history.back()" class="back-link" style="margin-bottom: 24px; display: inline-block;">← Back to browsing</a>
        
        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 40px; align-items: start;">
            
            <!-- Left Main Column: Content, Variables, Comments -->
            <div style="display: flex; flex-direction: column; gap: 32px;">
                
                <div class="card-text-wrap" style="background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.2);">
                    <div style="padding: 16px 24px; background: var(--bg3); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-family: var(--font-mono); font-size: .85rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Prompt Content</span>
                        <button class="btn-primary" style="padding: 8px 16px; font-size: .75rem;" onclick="window.app.copyFinalPrompt(this)">Copy Prompt</button>
                    </div>
                    <div class="md-content" id="finalPromptContent" style="min-height: 200px; padding: 24px; background: var(--bg2); color: var(--text); font-family: var(--font-display);">
                        ${marked.parse(currentPrompt.content)}
                    </div>
                </div>

                ${hasVariables ? `
                <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px;">
                    <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Customize Variables</h3>
                    <p style="font-size: .85rem; color: var(--text-muted); margin-bottom: 24px;">Fill in the placeholders below to instantly customize the prompt content above.</p>
                    
                    <form id="variablesForm" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                        ${currentPrompt.variables.map(v => `
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="font-family: var(--font-mono); color: var(--accent);">${v.name}</label>
                                <input type="text" class="var-input" data-var="[${v.name}]" placeholder="e.g. ${v.placeholder || v.name}" oninput="window.app.updatePromptPreview()" style="margin-top: 8px;"/>
                            </div>
                        `).join('')}
                    </form>
                </div>
                ` : ''}

                <!-- Comments Section -->
                <div style="margin-top: 16px;">
                    <h3 style="font-size: 1.3rem; margin-bottom: 24px;">Discussion (${comments.length})</h3>
                    
                    <form onsubmit="event.preventDefault(); window.app.postComment('${currentPrompt.id}');" style="margin-bottom: 32px; display: flex; gap: 12px; flex-direction: column;">
                        <textarea id="commentContent" placeholder="What do you think about this prompt?" style="min-height: 100px;" required></textarea>
                        <button type="submit" class="btn-primary" id="commentBtn" style="align-self: flex-start;">Post Comment</button>
                        <div class="submit-feedback status-error" id="commentError" style="display:none;"></div>
                    </form>

                    <div id="commentsList" style="display: flex; flex-direction: column; gap: 16px;">
                        ${comments.length > 0 ? comments.map(c => {
                            const canDeleteComment = window.app.authManager.user?.uid === c.authorId || window.app.authManager.isAdmin;
                            return `
                            <div style="background: var(--bg2); border: 1px solid var(--border); padding: 20px; border-radius: var(--radius-lg);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <div>
                                        <strong style="color: var(--accent); font-size: .95rem;">${c.authorUsername}</strong>
                                        <div style="color: var(--text-dim); font-size: .75rem;">${c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</div>
                                    </div>
                                    ${canDeleteComment ? `
                                    <button onclick="window.app.deleteComment('${c.id}', '${c.authorId}')" style="background: none; border: none; color: #ef4444; font-size: .8rem; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">Delete</button>
                                    ` : ''}
                                </div>
                                <p style="font-size: .95rem; color: var(--text); line-height: 1.6;">${c.content.replace(/\n/g, '<br>')}</p>
                            </div>
                            `;
                        }).join('') : '<p style="color: var(--text-dim); font-size: .95rem;">No comments yet. Be the first to start the discussion!</p>'}
                    </div>
                </div>
            </div>

            <!-- Right Sidebar: Metadata & Actions -->
            <div style="display: flex; flex-direction: column; gap: 24px; position: sticky; top: 100px;">
                <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px;">
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
                        <span class="cat-badge" data-cat="${currentPrompt.category}">${currentPrompt.category}</span>
                        ${currentPrompt.targetModel ? `<span class="tag" style="font-size: .68rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: var(--bg3); border: 1px solid var(--border-hi);">🤖 ${currentPrompt.targetModel}</span>` : ''}
                    </div>
                    
                    <h1 style="font-size: 1.8rem; line-height: 1.2; margin-bottom: 16px;">${currentPrompt.title}</h1>
                    
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg3); border: 1px solid var(--border-hi); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--accent);">
                            ${currentPrompt.authorUsername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size: .9rem; font-weight: bold;">${currentPrompt.authorUsername}</div>
                            <div style="font-size: .8rem; color: var(--text-dim);">
                                ${new Date(currentPrompt.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()} • 👁 ${currentPrompt.views || 0}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn-primary" onclick="window.app.upvotePrompt('${currentPrompt.id}', this)" style="width: 100%; justify-content: center; padding: 14px; font-size: .95rem; ${hasUpvoted ? 'background: var(--accent); color: var(--bg);' : ''}">
                            ▲ ${hasUpvoted ? 'Upvoted' : 'Upvote'} (${currentPrompt.upvotes || 0})
                        </button>
                        <button class="btn-ghost" onclick="window.app.toggleBookmark('${currentPrompt.id}', this)" style="width: 100%; justify-content: center; padding: 14px; font-size: .95rem; color: ${isBookmarked ? 'var(--accent)' : 'inherit'}; border-color: ${isBookmarked ? 'var(--accent)' : 'var(--border)'};">
                            ${isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                        </button>
                        <button class="btn-ghost" onclick="window.app.router.navigate('/prompt-editor?forkId=${currentPrompt.id}')" style="width: 100%; justify-content: center; padding: 14px; font-size: .95rem;">
                            ⎇ Fork Prompt
                        </button>
                        ${canDeletePrompt ? `
                        <button class="btn-ghost" onclick="window.app.deleteCurrentPrompt()" style="width: 100%; justify-content: center; padding: 14px; font-size: .95rem; border-color: #ef4444; color: #ef4444; margin-top: 12px;">
                            🗑 Delete Prompt
                        </button>
                        ` : ''}
                    </div>
                </div>

                ${currentPrompt.description ? `
                <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 16px;">About this prompt</h3>
                    <div style="color: var(--text-muted); line-height: 1.6; font-size: .9rem;" class="md-content">
                        ${marked.parse(currentPrompt.description)}
                    </div>
                </div>
                ` : ''}
            </div>

        </div>
    </div>
    `;
}

export function init() {
    window.app.toggleBookmark = async (id, btn) => {
        if (!window.app.authManager.user) {
            alert('Must be logged in to bookmark prompts.');
            return;
        }
        
        btn.disabled = true;
        try {
            const isNowBookmarked = await usersService.toggleBookmark(window.app.authManager.user.uid, id);
            if (isNowBookmarked) {
                btn.innerHTML = '★ Bookmarked';
                btn.style.color = 'var(--accent)';
                btn.style.borderColor = 'var(--accent)';
            } else {
                btn.innerHTML = '☆ Bookmark';
                btn.style.color = '';
                btn.style.borderColor = '';
            }
        } catch (error) {
            alert("Error toggling bookmark: " + error.message);
        } finally {
            btn.disabled = false;
        }
    };

    window.app.deleteCurrentPrompt = async () => {
        if (!confirm("Are you sure you want to delete this prompt? This action cannot be undone.")) return;
        try {
            await promptsService.deletePrompt(currentPrompt.id, currentPrompt.authorId);
            window.app.router.navigate('/prompts');
        } catch (error) {
            alert("Error deleting prompt: " + error.message);
        }
    };

    window.app.updatePromptPreview = () => {
        if (!currentPrompt) return;
        let finalContent = currentPrompt.content;
        
        const inputs = document.querySelectorAll('.var-input');
        inputs.forEach(input => {
            const varName = input.getAttribute('data-var');
            const val = input.value.trim();
            if (val) {
                // Global replace using regex
                const regex = new RegExp(`\\[${varName.replace(/\[|\]/g, '')}\\]`, 'g');
                finalContent = finalContent.replace(regex, val);
            }
        });

        document.getElementById('finalPromptContent').innerHTML = marked.parse(finalContent);
        window.app._currentRawPrompt = finalContent;
    };

    window.app.copyFinalPrompt = (btn) => {
        const text = window.app._currentRawPrompt || currentPrompt.content;
        navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
    };

    window.app.postComment = async (targetId) => {
        if (!window.app.authManager.user) {
            alert('Please log in to leave a comment.');
            window.app.router.navigate('/login');
            return;
        }

        const input = document.getElementById('commentContent');
        const btn = document.getElementById('commentBtn');
        const err = document.getElementById('commentError');
        const content = input.value;

        btn.disabled = true;
        btn.textContent = 'Posting...';
        err.style.display = 'none';

        try {
            await commentsService.postComment(targetId, 'prompt', content);
            // Quick reload of the page to show comment
            // In a real app we would prepend the comment HTML dynamically
            window.app.router.handleRoute();
        } catch (error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Post Comment';
        }
    };

    window.app.deleteComment = async (commentId, authorId) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
            await commentsService.deleteComment(commentId, authorId);
            window.app.router.handleRoute(); // refresh
        } catch (error) {
            alert("Error deleting comment: " + error.message);
        }
    };
}
