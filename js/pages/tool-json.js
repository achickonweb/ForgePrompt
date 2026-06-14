export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">JSON Formatter</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Validate, format, and minify JSON data instantly in your browser.</p>

        <div class="tool-controls">
            <button class="tool-btn active" id="btn-format" onclick="window.app.jsonFormat()">Format / Prettify</button>
            <button class="tool-btn" id="btn-minify" onclick="window.app.jsonMinify()">Minify</button>
            <button class="tool-btn" onclick="window.app.jsonClear()">Clear</button>
            <div style="flex:1"></div>
            <button class="tool-btn btn-copy-tool" onclick="window.app.jsonCopy()">Copy Result</button>
        </div>

        <div class="tool-status" id="jsonStatus">Ready. Paste your JSON below.</div>

        <div class="tool-editor-wrap" style="grid-template-columns: 1fr;">
            <div class="editor-pane">
                <div class="pane-label">Input / Output</div>
                <textarea class="code-area" id="jsonInput" placeholder='{"paste": "your JSON here"}' style="min-height: 400px;"></textarea>
            </div>
        </div>

        <div class="tool-tips">
            <h4>💡 Tool Tips</h4>
            <ul>
                <li>The formatter automatically validates your JSON structure.</li>
                <li>Data never leaves your browser; it is entirely client-side.</li>
                <li>Formatting uses 2 spaces for indentation by default.</li>
            </ul>
        </div>
    </div>
    `;
}

export function init() {
    const input = document.getElementById('jsonInput');
    const status = document.getElementById('jsonStatus');

    const updateStatus = (msg, type) => {
        status.className = `tool-status status-${type}`;
        status.textContent = msg;
    };

    window.app.jsonFormat = () => {
        const val = input.value.trim();
        if (!val) { updateStatus("Input is empty.", "warn"); return; }
        try {
            const parsed = JSON.parse(val);
            input.value = JSON.stringify(parsed, null, 2);
            updateStatus("Valid JSON. Formatted successfully.", "success");
        } catch (e) {
            updateStatus(`Invalid JSON: ${e.message}`, "error");
        }
    };

    window.app.jsonMinify = () => {
        const val = input.value.trim();
        if (!val) { updateStatus("Input is empty.", "warn"); return; }
        try {
            const parsed = JSON.parse(val);
            input.value = JSON.stringify(parsed);
            updateStatus("Valid JSON. Minified successfully.", "success");
        } catch (e) {
            updateStatus(`Invalid JSON: ${e.message}`, "error");
        }
    };

    window.app.jsonClear = () => {
        input.value = '';
        updateStatus("Ready. Paste your JSON below.", "success");
    };

    window.app.jsonCopy = () => {
        navigator.clipboard.writeText(input.value);
        updateStatus("Copied to clipboard!", "success");
    };
}
