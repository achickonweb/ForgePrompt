export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">URL Parser</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Extract protocol, host, path, and query parameters from a URL.</p>

        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Enter URL</label>
                <input type="text" id="uriInput" placeholder="https://example.com/path?query=123" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;" oninput="window.app.uriParse()">
            </div>

            <div id="uriError" style="color: var(--red); display: none; margin-bottom: 24px; font-size: .85rem;">Invalid URL format. Include http:// or https://</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Protocol</label>
                    <input type="text" id="uriProtocol" readonly style="font-family: var(--font-mono); padding: 10px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--accent); border-radius: 4px;">
                </div>
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Host</label>
                    <input type="text" id="uriHost" readonly style="font-family: var(--font-mono); padding: 10px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--accent); border-radius: 4px;">
                </div>
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Path</label>
                    <input type="text" id="uriPath" readonly style="font-family: var(--font-mono); padding: 10px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--accent); border-radius: 4px;">
                </div>
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Hash</label>
                    <input type="text" id="uriHash" readonly style="font-family: var(--font-mono); padding: 10px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--accent); border-radius: 4px;">
                </div>
            </div>

            <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Query Parameters</label>
            <textarea id="uriQuery" readonly style="min-height: 150px; background: var(--bg3); font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); color: var(--accent); border-radius: 4px;"></textarea>
        </div>
    </div>
    `;
}

export function init() {
    const input = document.getElementById('uriInput');
    const err = document.getElementById('uriError');
    
    window.app.uriParse = () => {
        const val = input.value.trim();
        if(!val) {
            ['Protocol','Host','Path','Hash','Query'].forEach(id => document.getElementById('uri'+id).value = '');
            err.style.display = 'none';
            return;
        }

        try {
            const url = new URL(val);
            err.style.display = 'none';
            document.getElementById('uriProtocol').value = url.protocol;
            document.getElementById('uriHost').value = url.host;
            document.getElementById('uriPath').value = url.pathname;
            document.getElementById('uriHash').value = url.hash;
            
            let queryStr = '';
            for (const [key, value] of url.searchParams.entries()) {
                queryStr += \`\${key}: \${value}\\n\`;
            }
            document.getElementById('uriQuery').value = queryStr || 'No query parameters';
        } catch(e) {
            err.style.display = 'block';
        }
    };
}
