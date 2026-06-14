import { promptsService } from '../services/prompts-service.js';
import { requestsService } from '../services/requests-service.js';

export async function render() {
    if (!window.app.authManager.isAdmin) {
        window.app.router.navigate('/');
        return `<div class="section"><p class="status-error">Unauthorized Access</p></div>`;
    }

    // Fetch all prompts (ignoring filters for admin view)
    const prompts = await promptsService.getPrompts({ sort: 'newest' });
    
    // Fetch requests (open only for now)
    const requests = await requestsService.getRequests('open');

    return `
    <div class="page-hero page-hero--sm" style="text-align: left; padding: 40px 0; border-bottom: 1px solid #ef4444;">
        <div class="page-hero-inner" style="max-width: 1000px;">
            <h1 class="page-title" style="color: #ef4444; margin-bottom: 8px;">Admin Dashboard</h1>
            <p style="color: var(--text-muted); font-family: var(--font-mono);">God Mode Activated: Proceed with caution.</p>
        </div>
    </div>

    <div class="section" style="max-width: 1000px; padding-top: 40px;">
        <div style="display: flex; gap: 32px; border-bottom: 1px solid var(--border); margin-bottom: 32px;">
            <div class="admin-tab active" onclick="window.app.switchAdminTab('prompts', this)" style="padding-bottom: 16px; font-weight: bold; cursor: pointer; border-bottom: 2px solid #ef4444; color: var(--text);">All Prompts (${prompts.length})</div>
            <div class="admin-tab" onclick="window.app.switchAdminTab('requests', this)" style="padding-bottom: 16px; font-weight: bold; cursor: pointer; color: var(--text-muted);">Open Requests (${requests.length})</div>
        </div>

        <!-- Prompts Tab -->
        <div id="admin_prompts" class="admin-tab-content" style="display: block;">
            <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: .9rem;">
                    <thead>
                        <tr style="background: var(--bg3); border-bottom: 1px solid var(--border);">
                            <th style="padding: 16px;">Title</th>
                            <th style="padding: 16px;">Author</th>
                            <th style="padding: 16px;">Date</th>
                            <th style="padding: 16px; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prompts.map(p => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 16px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <a href="/prompt-detail?id=${p.id}" style="color: var(--text);">${p.title}</a>
                            </td>
                            <td style="padding: 16px; color: var(--text-muted);">${p.authorUsername}</td>
                            <td style="padding: 16px; color: var(--text-muted);">${new Date(p.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</td>
                            <td style="padding: 16px; text-align: right;">
                                <button onclick="window.app.adminDeletePrompt('${p.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold; text-decoration: underline;">DELETE</button>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Requests Tab -->
        <div id="admin_requests" class="admin-tab-content" style="display: none;">
            <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: .9rem;">
                    <thead>
                        <tr style="background: var(--bg3); border-bottom: 1px solid var(--border);">
                            <th style="padding: 16px;">Title</th>
                            <th style="padding: 16px;">Author</th>
                            <th style="padding: 16px;">Answers</th>
                            <th style="padding: 16px; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(r => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 16px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <a href="/request-detail?id=${r.id}" style="color: var(--text);">${r.title}</a>
                            </td>
                            <td style="padding: 16px; color: var(--text-muted);">${r.authorUsername}</td>
                            <td style="padding: 16px; color: var(--text-muted);">${r.submissionCount || 0}</td>
                            <td style="padding: 16px; text-align: right;">
                                <button onclick="window.app.adminDeleteRequest('${r.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold; text-decoration: underline;">DELETE</button>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

    </div>
    `;
}

export function init() {
    window.app.switchAdminTab = (tabId, element) => {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.admin-tab').forEach(el => {
            el.style.borderBottom = 'none';
            el.style.color = 'var(--text-muted)';
            el.classList.remove('active');
        });
        
        document.getElementById('admin_' + tabId).style.display = 'block';
        element.style.borderBottom = '2px solid #ef4444';
        element.style.color = 'var(--text)';
        element.classList.add('active');
    };

    window.app.adminDeletePrompt = async (id) => {
        if (!confirm("ADMIN ACTION: Delete this prompt entirely from the database?")) return;
        try {
            await promptsService.deletePrompt(id, 'admin_bypass');
            window.app.router.handleRoute(); // refresh page
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    window.app.adminDeleteRequest = async (id) => {
        if (!confirm("ADMIN ACTION: Delete this request entirely from the database?")) return;
        try {
            await requestsService.deleteRequest(id, 'admin_bypass');
            window.app.router.handleRoute();
        } catch (error) {
            alert("Error: " + error.message);
        }
    };
}
