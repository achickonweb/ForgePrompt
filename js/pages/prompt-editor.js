import { promptsService } from '../services/prompts-service.js';

export async function render() {
    return `
    <div class="page-hero page-hero--sm">
      <div class="page-hero-inner">
        <h1 class="page-title">Submit Prompt</h1>
        <p class="page-sub">Share your best AI workflows and earn reputation.</p>
      </div>
    </div>

    <div class="section" style="max-width: 800px; padding-top: 40px;">
        <div class="modal-box" style="margin: 0 auto; box-shadow: none; border: 1px solid var(--border);">
            <form id="promptEditorForm" onsubmit="event.preventDefault(); window.app.handlePromptSubmit();">
                <div class="form-group">
                    <label>Title <span class="required">*</span></label>
                    <input type="text" id="p_title" required placeholder="e.g. Expert Code Reviewer" maxlength="100" />
                </div>
                
                <div style="display: flex; gap: 20px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Category <span class="required">*</span></label>
                        <select id="p_category" required>
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
                        <label>Target Model (Optional)</label>
                        <select id="p_model">
                            <option value="">— Any Model —</option>
                            <option value="GPT-4">GPT-4</option>
                            <option value="Claude 3">Claude 3</option>
                            <option value="Midjourney">Midjourney</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Description (Optional)</label>
                    <div class="md-editor" id="md_p_desc">
                        <div class="md-tabs">
                            <div class="md-tab active" onclick="window.app.toggleMdTab('md_p_desc', false)">Write</div>
                            <div class="md-tab" onclick="window.app.toggleMdTab('md_p_desc', true)">Preview</div>
                        </div>
                        <div class="md-body">
                            <textarea id="p_desc" style="min-height: 100px; padding: 16px;" placeholder="Briefly explain what this prompt does..."></textarea>
                            <div class="md-preview md-content"></div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Prompt Content <span class="required">*</span></label>
                    <div style="font-size: .8rem; color: var(--text-dim); margin-bottom: 8px;">
                        Tip: Use [BRACKETS] to create customizable variables for users.
                    </div>
                    <div class="md-editor" id="md_p_content">
                        <div class="md-tabs">
                            <div class="md-tab active" onclick="window.app.toggleMdTab('md_p_content', false)">Write</div>
                            <div class="md-tab" onclick="window.app.toggleMdTab('md_p_content', true)">Preview</div>
                        </div>
                        <div class="md-body">
                            <textarea id="p_content" required style="min-height: 250px; padding: 16px;" placeholder="Act as a..."></textarea>
                            <div class="md-preview md-content"></div>
                        </div>
                    </div>
                </div>

                <div class="submit-feedback status-error" id="editorError" style="display:none; margin-bottom: 16px;"></div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn-primary btn-lg" id="submitBtn">Publish Prompt →</button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const forkId = urlParams.get('forkId');
    
    if (forkId) {
        promptsService.getPromptById(forkId).then(prompt => {
            if (prompt) {
                document.getElementById('p_title').value = prompt.title + " (Fork)";
                document.getElementById('p_category').value = prompt.category;
                document.getElementById('p_model').value = prompt.targetModel || '';
                document.getElementById('p_desc').value = prompt.description || '';
                document.getElementById('p_content').value = prompt.content || '';
                
                // Refresh previews if MD tab logic exists
                if (window.app.toggleMdTab) {
                    window.app.toggleMdTab('md_p_desc', true);
                    window.app.toggleMdTab('md_p_desc', false);
                    window.app.toggleMdTab('md_p_content', true);
                    window.app.toggleMdTab('md_p_content', false);
                }
            }
        });
    }

    window.app.handlePromptSubmit = async () => {
        if (!window.app.authManager.user) {
            alert('You must be logged in to submit a prompt.');
            window.app.router.navigate('/login');
            return;
        }

        const title = document.getElementById('p_title').value;
        const category = document.getElementById('p_category').value;
        const model = document.getElementById('p_model').value;
        const description = document.getElementById('p_desc').value;
        const content = document.getElementById('p_content').value;
        
        const btn = document.getElementById('submitBtn');
        const err = document.getElementById('editorError');
        
        btn.disabled = true;
        btn.textContent = 'Publishing...';
        err.style.display = 'none';

        try {
            const promptId = await promptsService.createPrompt({
                title,
                category,
                targetModel: model,
                description,
                content
            });
            
            // Redirect to the newly created prompt detail page
            window.app.router.navigate(`/prompt-detail?id=${promptId}`);
        } catch (error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Publish Prompt →';
        }
    };
}
