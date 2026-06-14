export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 800px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">UUID Generator</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Generate v4 UUIDs individually or in bulk using cryptographically secure random numbers.</p>

        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
            <div style="flex: 1; display: flex; align-items: center; gap: 12px; background: var(--bg2); padding: 12px; border: 1px solid var(--border); border-radius: var(--radius);">
                <label>How many?</label>
                <input type="number" id="uuidCount" value="1" min="1" max="1000" style="width: 80px; padding: 6px; background: var(--bg3); border: 1px solid var(--border-hi); color: var(--text); border-radius: 4px;" />
            </div>
            <button class="btn-primary" onclick="window.app.uuidGenerate()">Generate</button>
            <button class="btn-primary" onclick="window.app.uuidCopy()" style="background: var(--bg3); color: var(--text); border: 1px solid var(--border-hi);">Copy All</button>
        </div>

        <textarea class="code-area" id="uuidResult" readonly style="min-height: 400px; font-family: var(--font-mono); font-size: 1.1rem; line-height: 1.8; padding: 24px; text-align: center;"></textarea>
    </div>
    `;
}

export function init() {
    window.app.uuidGenerate = () => {
        const count = parseInt(document.getElementById('uuidCount').value) || 1;
        const max = Math.min(count, 1000); // limit bulk
        
        let uuids = [];
        for (let i = 0; i < max; i++) {
            uuids.push(crypto.randomUUID());
        }
        
        document.getElementById('uuidResult').value = uuids.join('\n');
    };

    window.app.uuidCopy = () => {
        const res = document.getElementById('uuidResult');
        if (!res.value) return;
        navigator.clipboard.writeText(res.value);
        alert('Copied to clipboard!');
    };

    // Initial generate
    window.app.uuidGenerate();
}
