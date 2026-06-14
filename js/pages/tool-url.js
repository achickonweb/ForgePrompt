export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">URL Encoder / Decoder</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Safely encode and decode URL parameters and components.</p>

        <div class="b64-tabs">
            <button class="tab-btn active" id="tab-url-encode" onclick="window.app.setUrlMode('encode')">Encode</button>
            <button class="tab-btn" id="tab-url-decode" onclick="window.app.setUrlMode('decode')">Decode</button>
        </div>

        <div class="tool-editor-wrap">
            <div class="editor-pane">
                <div class="pane-label">Input</div>
                <textarea class="code-area" id="urlInput" placeholder="Type or paste here..." oninput="window.app.urlProcess()"></textarea>
            </div>
            <div class="editor-divider">
                <button class="transform-btn" onclick="window.app.urlSwap()">⇄</button>
            </div>
            <div class="editor-pane">
                <div class="pane-label" id="lbl-url-out" style="justify-content: space-between;">
                    Output
                    <button class="btn-primary" style="padding: 2px 8px; font-size: .7rem;" onclick="window.app.urlCopy()">Copy</button>
                </div>
                <textarea class="code-area code-output" id="urlOutput" readonly style="background: rgba(0,0,0,0.2);"></textarea>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    let mode = 'encode';
    const input = document.getElementById('urlInput');
    const output = document.getElementById('urlOutput');

    window.app.setUrlMode = (newMode) => {
        mode = newMode;
        document.getElementById('tab-url-encode').classList.toggle('active', mode === 'encode');
        document.getElementById('tab-url-decode').classList.toggle('active', mode === 'decode');
        window.app.urlProcess();
    };

    window.app.urlSwap = () => {
        input.value = output.value;
        window.app.setUrlMode(mode === 'encode' ? 'decode' : 'encode');
    };

    window.app.urlProcess = () => {
        const val = input.value;
        if (!val) { output.value = ''; return; }
        try {
            if (mode === 'encode') output.value = encodeURIComponent(val);
            else output.value = decodeURIComponent(val);
        } catch (e) {
            output.value = 'Invalid input';
        }
    };

    window.app.urlCopy = () => {
        navigator.clipboard.writeText(output.value);
        alert('Copied to clipboard!');
    };
}
