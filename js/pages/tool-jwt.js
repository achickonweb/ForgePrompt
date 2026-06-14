export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">JWT Decoder</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Decode JSON Web Tokens instantly. No data is sent to any server.</p>

        <div class="tool-editor-wrap">
            <div class="editor-pane">
                <div class="pane-label">Encoded JWT (Paste here)</div>
                <textarea class="code-area" id="jwtInput" placeholder="eyJhbGciOiJIUzI1NiIsInR..." oninput="window.app.jwtProcess()" style="color: var(--accent);"></textarea>
            </div>
            <div class="editor-divider" style="display: none;"></div>
            <div class="editor-pane">
                <div class="pane-label">Decoded Payload & Header</div>
                <div class="code-area code-output" id="jwtOutput" style="background: rgba(0,0,0,0.2); overflow: auto;"></div>
            </div>
        </div>
        <div class="tool-status" id="jwtStatus" style="display:none;"></div>
    </div>
    `;
}

export function init() {
    window.app.jwtProcess = () => {
        const val = document.getElementById('jwtInput').value.trim();
        const out = document.getElementById('jwtOutput');
        const status = document.getElementById('jwtStatus');
        
        status.style.display = 'none';
        out.innerHTML = '';

        if (!val) return;

        const parts = val.split('.');
        if (parts.length !== 3) {
            status.style.display = 'block';
            status.className = 'tool-status status-error';
            status.textContent = 'Invalid JWT format. Must contain 3 parts separated by dots.';
            return;
        }

        try {
            const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

            out.innerHTML = `
<div style="color: var(--text-dim); margin-bottom: 4px;">HEADER: ALGORITHM & TOKEN TYPE</div>
<pre style="color: #f87171; margin-bottom: 16px;">${JSON.stringify(header, null, 2)}</pre>
<div style="color: var(--text-dim); margin-bottom: 4px;">PAYLOAD: DATA</div>
<pre style="color: #a78bfa;">${JSON.stringify(payload, null, 2)}</pre>
            `;
            
            status.style.display = 'block';
            status.className = 'tool-status status-success';
            status.textContent = 'Decoded successfully!';
        } catch (e) {
            status.style.display = 'block';
            status.className = 'tool-status status-error';
            status.textContent = 'Error decoding token payload.';
        }
    };
}
