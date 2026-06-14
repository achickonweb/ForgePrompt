import { promptsService } from '../services/prompts-service.js';

export async function render() {
    // Get query params
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const category = urlParams.get('category') || 'All';
    const sort = urlParams.get('sort') || 'newest';

    const prompts = await promptsService.getPrompts({ category, sort });
    const currentUserId = window.app.authManager.user?.uid;

    return `
    <div class="page-hero page-hero--sm">
      <div class="page-hero-inner">
        <h1 class="page-title">Explore Prompts</h1>
        <p class="page-sub">Discover the most effective AI workflows created by the community.</p>
      </div>
    </div>

    <div class="filters-bar">
      <div class="filters-inner">
        <div class="filter-search search-box" style="margin: 0; flex: 1;">
          <span class="search-icon">⌕</span>
          <input type="text" placeholder="Search prompts..." />
        </div>
        
        <div class="filter-cats">
          <a href="/prompts?category=All&sort=${sort}" class="cat-chip ${category === 'All' ? 'active' : ''}">All</a>
          <a href="/prompts?category=ChatGPT&sort=${sort}" class="cat-chip ${category === 'ChatGPT' ? 'active' : ''}">ChatGPT</a>
          <a href="/prompts?category=Coding&sort=${sort}" class="cat-chip ${category === 'Coding' ? 'active' : ''}">Coding</a>
          <a href="/prompts?category=Image+Generation&sort=${sort}" class="cat-chip ${category === 'Image Generation' ? 'active' : ''}">Image Gen</a>
        </div>
        
        <div class="sort-wrap">
          <span class="sort-label">Sort:</span>
          <select id="sortSelect" onchange="window.app.changeSort(this.value)">
            <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest</option>
            <option value="top" ${sort === 'top' ? 'selected' : ''}>Top Voted</option>
          </select>
        </div>
      </div>
    </div>

    <div class="section" style="padding-top: 40px;">
      <div class="results-meta">
        <p class="results-count">Showing <strong>${prompts.length}</strong> results for <em>${category}</em></p>
      </div>
      
      ${prompts.length > 0 ? `
      <div class="prompt-grid">
        ${prompts.map(p => {
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
        `}).join('')}
      </div>
      ` : `
      <div class="empty-state">
        <div class="empty-icon">∅</div>
        <h3>No prompts found</h3>
        <p>Be the first to share a prompt in this category!</p>
        <a href="/prompt-editor" class="btn-primary">Submit a Prompt</a>
      </div>
      `}
    </div>
    `;
}

export function init() {
    window.app.changeSort = (sort) => {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
        const category = urlParams.get('category') || 'All';
        window.app.router.navigate(`/prompts?category=${category}&sort=${sort}`);
    };
}
