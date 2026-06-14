import { Router } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { authManager } from './auth.js';
import { promptsService } from './services/prompts-service.js';

// Application entry point
class App {
    constructor() {
        this.init();
    }

    // Global helper for Markdown Editors
    toggleMdTab(editorId, isPreview) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        const tabs = editor.querySelectorAll('.md-tab');
        if (isPreview) {
            tabs[0].classList.remove('active');
            tabs[1].classList.add('active');
            editor.classList.add('preview-mode');
            const text = editor.querySelector('textarea').value;
            editor.querySelector('.md-preview').innerHTML = window.marked ? marked.parse(text || '*Nothing to preview*') : text;
        } else {
            tabs[1].classList.remove('active');
            tabs[0].classList.add('active');
            editor.classList.remove('preview-mode');
        }
    }

    async upvotePrompt(id, btn) {
        if (!this.authManager.user) {
            alert('Please log in to upvote');
            return;
        }
        btn.disabled = true;
        try {
            const res = await promptsService.toggleUpvote(id);
            const isDetail = btn.classList.contains('btn-primary'); // Detail page uses btn-primary

            if (res.hasUpvoted) {
                if (isDetail) {
                    btn.innerHTML = `▲ Upvoted (${res.newCount})`;
                    btn.style.background = 'var(--accent)';
                    btn.style.color = 'var(--bg)';
                } else {
                    btn.innerHTML = `▲ ${res.newCount}`;
                    btn.style.borderColor = 'var(--accent)';
                    btn.style.color = 'var(--accent)';
                    btn.style.background = 'rgba(0,255,136,0.1)';
                }
            } else {
                if (isDetail) {
                    btn.innerHTML = `▲ Upvote (${res.newCount})`;
                    btn.style.background = '';
                    btn.style.color = '';
                } else {
                    btn.innerHTML = `▲ ${res.newCount}`;
                    btn.style.borderColor = '';
                    btn.style.color = '';
                    btn.style.background = '';
                }
            }
        } catch (error) {
            alert("Error toggling upvote: " + error.message);
        } finally {
            btn.disabled = false;
        }
    }

    copyPromptText(text, btn) {
        navigator.clipboard.writeText(text);
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }

    init() {
        // Render static layout
        document.getElementById('navbar-container').innerHTML = renderNavbar();
        document.getElementById('footer-container').innerHTML = renderFooter();

        // Initialize Router & Auth
        this.router = new Router();
        this.authManager = authManager;
    }
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
