import { requestsService } from '../services/requests-service.js';

export async function render() {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const status = urlParams.get('status') || 'open';

    const requests = await requestsService.getRequests(status);

    return `
    <div class="page-hero page-hero--sm">
      <div class="page-hero-inner">
        <h1 class="page-title">Prompt Requests</h1>
        <p class="page-sub">Stack Overflow for Prompts. Need something specific? Offer a bounty. Know the answer? Earn reputation.</p>
        <div style="margin-top: 24px;">
            <a href="/request-editor" class="btn-primary">Ask for a Prompt</a>
        </div>
      </div>
    </div>

    <div class="filters-bar">
      <div class="filters-inner">
        <div class="filter-cats" style="margin-top: 12px;">
          <a href="/requests?status=open" class="cat-chip ${status === 'open' ? 'active' : ''}">Open Requests</a>
          <a href="/requests?status=solved" class="cat-chip ${status === 'solved' ? 'active' : ''}">Solved</a>
        </div>
      </div>
    </div>

    <div class="section" style="padding-top: 40px;">
      ${requests.length > 0 ? `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${requests.map(req => `
            <div class="prompt-card" style="display: flex; flex-direction: row; align-items: stretch; padding: 0; cursor: pointer;" onclick="window.app.router.navigate('/request-detail?id=${req.id}')">
                <!-- Left stats column -->
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

                <!-- Right content column -->
                <div style="padding: 20px; flex: 1;">
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <span class="cat-badge" data-cat="${req.category}">${req.category}</span>
                        ${req.targetModel ? `<span class="tag">🤖 ${req.targetModel}</span>` : ''}
                    </div>
                    <h3 style="font-size: 1.1rem; margin-bottom: 8px; color: var(--accent2);">${req.title}</h3>
                    <p style="font-size: .85rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${req.description}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: .8rem; color: var(--text-dim);">
                        <div>Asked by <strong>${req.authorUsername}</strong></div>
                        <div>${new Date(req.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
        `).join('')}
      </div>
      ` : `
      <div class="empty-state">
        <div class="empty-icon">∅</div>
        <h3>No requests found</h3>
        <p>There are no ${status} requests at the moment.</p>
      </div>
      `}
    </div>
    `;
}

export function init() {}
