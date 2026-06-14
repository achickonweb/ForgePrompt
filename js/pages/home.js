import { promptsService } from '../services/prompts-service.js';

export async function render() {
    const popularPrompts = await promptsService.getPrompts({ sort: 'top' });
    const top3 = popularPrompts.slice(0, 3);
    const currentUserId = window.app.authManager.user?.uid;

    return `
    <section class="hero">
      <div class="hero-grid-bg" aria-hidden="true"></div>
      <div class="hero-inner">
        <div class="hero-badge">Open Community · Real Stats · No Fakes</div>
        <h1 class="hero-title">
          The Prompt Library<br />
          <span class="hero-accent">Built for Builders.</span>
        </h1>
        <p class="hero-sub">
          Curated AI prompts for ChatGPT, coding &amp; creative generation.<br />
          Plus instant dev tools — all in one place.
        </p>
        
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input type="text" id="heroSearch" placeholder="Search prompts… e.g. code review, cyberpunk" />
          <button class="search-btn" onclick="window.app.router.navigate('/prompts')">Search</button>
        </div>
      </div>
    </section>

    <section class="stats-bar">
      <div class="stat-item"><span class="stat-num">500+</span><span class="stat-label">Prompts</span></div>
      <div class="stat-divider">|</div>
      <div class="stat-item"><span class="stat-num">1.2k</span><span class="stat-label">Members</span></div>
      <div class="stat-divider">|</div>
      <div class="stat-item"><span class="stat-num">8</span><span class="stat-label">Dev Tools</span></div>
    </section>
    
    <section class="section">
      <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span class="section-tag">// recent</span>
          <h2 class="section-title" style="margin: 0;">Explore Prompts</h2>
        </div>
        <a href="/prompts" class="see-all-link" style="margin-left: 20px;">View all →</a>
      </div>
      
      <div class="prompt-grid">
        ${top3.length > 0 ? top3.map(p => {
            const hasUpvoted = currentUserId && p.upvotedBy?.includes(currentUserId);
            const upvoteStyle = hasUpvoted ? 'border-color: var(--accent); color: var(--accent); background: rgba(0,255,136,0.1);' : '';
            return `
            <div class="prompt-card" onclick="window.app.router.navigate('/prompt-detail?id=${p.id}')">
                <div class="card-top">
                    <span class="cat-badge" data-cat="${p.category}">${p.category}</span>
                    <div class="card-meta-right">👁 ${p.views || 0}</div>
                </div>
                <h3 class="card-title">${p.title}</h3>
                <p class="card-preview">${(p.description || p.content || '').substring(0, 150)}...</p>
                <div class="card-footer">
                    <button class="upvote-btn" style="${upvoteStyle}" onclick="event.stopPropagation(); window.app.upvotePrompt('${p.id}', this)">▲ ${p.upvotes || 0}</button>
                    <button class="copy-btn" onclick="event.stopPropagation(); window.app.copyPromptText(\`${(p.content||'').replace(/`/g, '\\`')}\`, this)">Copy</button>
                </div>
            </div>
        `}).join('') : `
            <p style="color: var(--text-dim); text-align: center; width: 100%;">No prompts yet. <a href="/prompt-editor" style="color: var(--accent);">Be the first to create one!</a></p>
        `}
      </div>
    </section>
    `;
}

export function init() {
    // Methods moved to app.js
}
