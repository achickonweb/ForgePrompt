export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 800px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Hash Generator</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes instantly.</p>

        <div class="editor-pane" style="margin-bottom: 24px;">
            <div class="pane-label">Input Text</div>
            <textarea class="code-area" id="hashInput" placeholder="Enter text to hash..." oninput="window.app.hashProcess()" style="min-height: 150px;"></textarea>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: var(--bg2); padding: 16px; border: 1px solid var(--border); border-radius: var(--radius);">
                <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: .8rem; margin-bottom: 8px;">SHA-1</div>
                <input type="text" id="hashSha1" readonly style="width: 100%; background: var(--bg3); border: 1px solid var(--border-hi); color: var(--accent); padding: 8px; font-family: var(--font-mono); font-size: .9rem; border-radius: 4px;" />
            </div>
            
            <div style="background: var(--bg2); padding: 16px; border: 1px solid var(--border); border-radius: var(--radius);">
                <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: .8rem; margin-bottom: 8px;">SHA-256</div>
                <input type="text" id="hashSha256" readonly style="width: 100%; background: var(--bg3); border: 1px solid var(--border-hi); color: var(--accent); padding: 8px; font-family: var(--font-mono); font-size: .9rem; border-radius: 4px;" />
            </div>
            
            <div style="background: var(--bg2); padding: 16px; border: 1px solid var(--border); border-radius: var(--radius);">
                <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: .8rem; margin-bottom: 8px;">SHA-512</div>
                <input type="text" id="hashSha512" readonly style="width: 100%; background: var(--bg3); border: 1px solid var(--border-hi); color: var(--accent); padding: 8px; font-family: var(--font-mono); font-size: .9rem; border-radius: 4px;" />
            </div>
        </div>
    </div>
    `;
}

export function init() {
    // Helper to generate hash using Web Crypto API
    const generateHash = async (algorithm, data) => {
        const msgUint8 = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    window.app.hashProcess = async () => {
        const val = document.getElementById('hashInput').value;
        if (!val) {
            document.getElementById('hashSha1').value = '';
            document.getElementById('hashSha256').value = '';
            document.getElementById('hashSha512').value = '';
            return;
        }

        document.getElementById('hashSha1').value = await generateHash('SHA-1', val);
        document.getElementById('hashSha256').value = await generateHash('SHA-256', val);
        document.getElementById('hashSha512').value = await generateHash('SHA-512', val);
    };
}
