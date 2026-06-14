import { requestsService } from '../services/requests-service.js';

export async function render() {
    return `
    <div class="page-hero page-hero--sm">
      <div class="page-hero-inner">
        <h1 class="page-title">Request a Prompt</h1>
        <p class="page-sub">Ask the community for help crafting the perfect prompt.</p>
      </div>
    </div>

    <div class="section" style="max-width: 800px; padding-top: 40px;">
        <div class="modal-box" style="margin: 0 auto; box-shadow: none; border: 1px solid var(--border);">
            <form id="requestForm" onsubmit="event.preventDefault(); window.app.handleRequestSubmit();">
                <div class="form-group">
                    <label>Title <span class="required">*</span></label>
                    <input type="text" id="r_title" required placeholder="e.g. Need a Claude prompt for parsing weird JSON" maxlength="100" />
                </div>
                
                <div style="display: flex; gap: 20px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Category <span class="required">*</span></label>
                        <select id="r_category" required>
                            <option value="">— Select Category —</option>
                            <option value="ChatGPT">ChatGPT</option>
                            <option value="Coding">Coding</option>
                            <option value="Image Generation">Image Generation</option>
                            <option value="Video Generation">Video Generation</option>
                            <option value="Writing">Writing</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="flex: 1;">
                        <label>Target Model</label>
                        <select id="r_model">
                            <option value="Any">Any</option>
                            <option value="GPT-4">GPT-4</option>
                            <option value="Claude 3">Claude 3</option>
                            <option value="Midjourney">Midjourney</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Detailed Requirements <span class="required">*</span></label>
                    <div style="font-size: .8rem; color: var(--text-dim); margin-bottom: 8px;">
                        Explain exactly what inputs you have and what output you expect.
                    </div>
                    <div class="md-editor" id="md_r_desc">
                        <div class="md-tabs">
                            <div class="md-tab active" onclick="window.app.toggleMdTab('md_r_desc', false)">Write</div>
                            <div class="md-tab" onclick="window.app.toggleMdTab('md_r_desc', true)">Preview</div>
                        </div>
                        <div class="md-body">
                            <textarea id="r_desc" required style="min-height: 200px; padding: 16px;" placeholder="I have a large payload of malformed JSON from an old API..."></textarea>
                            <div class="md-preview md-content"></div>
                        </div>
                    </div>
                </div>

                <div class="submit-feedback status-error" id="reqError" style="display:none; margin-bottom: 16px;"></div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn-primary btn-lg" id="reqSubmitBtn">Post Request →</button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function init() {
    window.app.handleRequestSubmit = async () => {
        if (!window.app.authManager.user) {
            alert('You must be logged in to post a request.');
            window.app.router.navigate('/login');
            return;
        }

        const title = document.getElementById('r_title').value;
        const category = document.getElementById('r_category').value;
        const model = document.getElementById('r_model').value;
        const description = document.getElementById('r_desc').value;
        
        const btn = document.getElementById('reqSubmitBtn');
        const err = document.getElementById('reqError');
        
        btn.disabled = true;
        btn.textContent = 'Posting...';
        err.style.display = 'none';

        try {
            const reqId = await requestsService.createRequest({
                title,
                category,
                targetModel: model,
                description
            });
            window.app.router.navigate(`/request-detail?id=${reqId}`);
        } catch (error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Post Request →';
        }
    };
}
