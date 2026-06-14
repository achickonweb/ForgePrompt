import { usersService } from '../services/users-service.js';
import { requestsService } from '../services/requests-service.js';

export async function render() {
    if (!window.app.authManager.user) {
        window.app.router.navigate('/login');
        return `<div>Redirecting to login...</div>`;
    }

    const userId = window.app.authManager.user.uid;
    const profile = await usersService.getUserProfile(userId);
    const userPrompts = await usersService.getUserPrompts(userId);
    const bookmarkedPrompts = await usersService.getBookmarkedPrompts(userId);
    const userRequests = await requestsService.getUserRequests(userId);

    if (!profile) return `<div class="section"><p class="status-error">Error loading profile</p></div>`;

    return `
    <div style="background: linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,0,0,0) 100%); border-bottom: 1px solid var(--border); padding-bottom: 40px; padding-top: 60px;">
        <div class="section" style="max-width: 900px; padding-top: 0;">
            <div style="display: flex; gap: 32px; align-items: center;">
                <div style="width: 120px; height: 120px; border-radius: 50%; background: var(--bg2); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-family: var(--font-mono); color: var(--accent); border: 4px solid var(--bg); box-shadow: 0 0 0 2px var(--accent); position: relative;">
                    ${profile.username.substring(0,2).toUpperCase()}
                    <div style="position: absolute; bottom: 0; right: 0; background: var(--bg); border-radius: 50%; padding: 4px;">
                        <div style="background: var(--accent); width: 16px; height: 16px; border-radius: 50%;"></div>
                    </div>
                </div>
                <div>
                    <h1 class="page-title" style="margin-bottom: 8px;">${profile.username}</h1>
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <span class="tag" style="background: rgba(0,255,136,0.1); color: var(--accent); border: 1px solid var(--accent);">Level: ${profile.level}</span>
                        <span class="tag">Joined ${new Date(profile.joinedAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 40px;">
                <div style="background: var(--bg2); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
                    <div style="font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Reputation</div>
                    <div style="font-size: 2rem; font-weight: bold; font-family: var(--font-mono); color: var(--accent);">${profile.reputation}</div>
                </div>
                <div style="background: var(--bg2); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
                    <div style="font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Published Prompts</div>
                    <div style="font-size: 2rem; font-weight: bold; font-family: var(--font-mono); color: var(--text);">${userPrompts.length}</div>
                </div>
                <div style="background: var(--bg2); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
                    <div style="font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Accepted Answers</div>
                    <div style="font-size: 2rem; font-weight: bold; font-family: var(--font-mono); color: var(--text);">${profile.requestsWon || 0}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section" style="max-width: 900px; padding-top: 40px;">
        <div style="display: flex; gap: 32px; border-bottom: 1px solid var(--border); margin-bottom: 32px;">
            <div class="profile-tab active" onclick="window.app.switchProfileTab('prompts', this)" style="padding-bottom: 16px; font-weight: bold; cursor: pointer; border-bottom: 2px solid var(--accent); color: var(--text);">My Prompts</div>
            <div class="profile-tab" onclick="window.app.switchProfileTab('bookmarks', this)" style="padding-bottom: 16px; font-weight: bold; cursor: pointer; color: var(--text-muted);">Bookmarks (${bookmarkedPrompts.length})</div>
            <div class="profile-tab" onclick="window.app.switchProfileTab('requests', this)" style="padding-bottom: 16px; font-weight: bold; cursor: pointer; color: var(--text-muted);">My Requests (${userRequests.length})</div>
        </div>
        
        <!-- Tab: My Prompts -->
        <div id="tab_prompts" class="profile-tab-content" style="display: block;">
            ${userPrompts.length > 0 ? `
            <div class="prompt-grid">
                ${userPrompts.map(p => {
                    const hasUpvoted = userId && p.upvotedBy?.includes(userId);
                    const upvoteStyle = hasUpvoted ? 'border-color: var(--accent); color: var(--accent); background: rgba(0,255,136,0.1);' : '';
                    return `
                    <div class="prompt-card" onclick="window.app.router.navigate('/prompt-detail?id=${p.id}')">
                        <div class="card-top">
                            <span class="cat-badge" data-cat="${p.category}">${p.category}</span>
                            <div class="card-meta-right">👁 ${p.views || 0}</div>
                        </div>
                        <h3 class="card-title">${p.title}</h3>
                        <p class="card-preview">${(p.description || p.content || '').substring(0, 100)}...</p>
                        <div class="card-footer">
                            <button class="upvote-btn" style="${upvoteStyle}" onclick="event.stopPropagation(); window.app.upvotePrompt('${p.id}', this)">▲ ${p.upvotes || 0}</button>
                            <button class="copy-btn" onclick="event.stopPropagation(); window.app.copyPromptText(\`${(p.content||'').replace(/`/g, '\\`')}\`, this)">Copy</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
            ` : `
            <div class="empty-state" style="padding: 60px 20px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg);">
                <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
                <h3 style="margin-bottom: 8px;">No Prompts Published</h3>
                <p style="color: var(--text-dim); margin-bottom: 24px;">You haven't shared any of your prompts with the community yet.</p>
                <a href="/prompt-editor" class="btn-primary">Create your first prompt</a>
            </div>
            `}
        </div>

        <!-- Tab: Bookmarks -->
        <div id="tab_bookmarks" class="profile-tab-content" style="display: none;">
            ${bookmarkedPrompts.length > 0 ? `
            <div class="prompt-grid">
                ${bookmarkedPrompts.map(p => {
                    const hasUpvoted = userId && p.upvotedBy?.includes(userId);
                    const upvoteStyle = hasUpvoted ? 'border-color: var(--accent); color: var(--accent); background: rgba(0,255,136,0.1);' : '';
                    return `
                    <div class="prompt-card" onclick="window.app.router.navigate('/prompt-detail?id=${p.id}')">
                        <div class="card-top">
                            <span class="cat-badge" data-cat="${p.category}">${p.category}</span>
                            <div class="card-meta-right" style="color: var(--accent);">★</div>
                        </div>
                        <h3 class="card-title">${p.title}</h3>
                        <p class="card-preview">${(p.description || p.content || '').substring(0, 100)}...</p>
                        <div class="card-footer">
                            <button class="upvote-btn" style="${upvoteStyle}" onclick="event.stopPropagation(); window.app.upvotePrompt('${p.id}', this)">▲ ${p.upvotes || 0}</button>
                            <button class="copy-btn" onclick="event.stopPropagation(); window.app.copyPromptText(\`${(p.content||'').replace(/`/g, '\\`')}\`, this)">Copy</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
            ` : `
            <div class="empty-state" style="padding: 60px 20px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg);">
                <div style="font-size: 3rem; margin-bottom: 16px;">★</div>
                <h3 style="margin-bottom: 8px;">No Bookmarks</h3>
                <p style="color: var(--text-dim); margin-bottom: 24px;">Save prompts you find useful by clicking the Bookmark button on a prompt's page.</p>
                <a href="/prompts" class="btn-primary">Explore Prompts</a>
            </div>
            `}
        </div>

        <!-- Tab: My Requests -->
        <div id="tab_requests" class="profile-tab-content" style="display: none;">
            ${userRequests.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${userRequests.map(req => `
                    <div class="prompt-card" style="display: flex; flex-direction: row; align-items: stretch; padding: 0; cursor: pointer;" onclick="window.app.router.navigate('/request-detail?id=${req.id}')">
                        <div style="background: var(--bg3); padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-width: 100px; border-right: 1px solid var(--border);">
                            <div style="text-align: center; color: var(--text-muted); font-size: .8rem;">
                                <span style="display: block; font-size: 1.2rem; color: var(--text); font-weight: bold; font-family: var(--font-mono);">${req.submissionCount || 0}</span>
                                answers
                            </div>
                            ${req.status === 'solved' ? `
                            <div style="background: rgba(0,255,136,.1); color: var(--accent); font-size: .7rem; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--accent);">
                                ✓ Solved
                            </div>
                            ` : ''}
                        </div>
                        <div style="padding: 20px; flex: 1;">
                            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                <span class="cat-badge" data-cat="${req.category}">${req.category}</span>
                            </div>
                            <h3 style="font-size: 1.1rem; margin-bottom: 8px; color: var(--accent2);">${req.title}</h3>
                            <p style="font-size: .85rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${req.description}
                            </p>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : `
            <div class="empty-state" style="padding: 60px 20px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg);">
                <div style="font-size: 3rem; margin-bottom: 16px;">❓</div>
                <h3 style="margin-bottom: 8px;">No Requests Made</h3>
                <p style="color: var(--text-dim); margin-bottom: 24px;">Need a specific prompt but can't find it? Ask the community!</p>
                <a href="/request-editor" class="btn-primary">Ask for a Prompt</a>
            </div>
            `}
        </div>
    </div>
    `;
}

export function init() {
    window.app.switchProfileTab = (tabId, element) => {
        // Hide all tabs
        document.querySelectorAll('.profile-tab-content').forEach(el => el.style.display = 'none');
        // Reset all buttons
        document.querySelectorAll('.profile-tab').forEach(el => {
            el.style.borderBottom = 'none';
            el.style.color = 'var(--text-muted)';
            el.classList.remove('active');
        });
        
        // Show active tab
        document.getElementById('tab_' + tabId).style.display = 'block';
        // Style active button
        element.style.borderBottom = '2px solid var(--accent)';
        element.style.color = 'var(--text)';
        element.classList.add('active');
    };
}
