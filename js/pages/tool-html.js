export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">HTML Entities</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Escape or unescape HTML special characters instantly.</p>

        <div class="tool-controls">
            <button class="tool-btn active" onclick="window.app.htmlEncode()">Encode (Escape)</button>
            <button class="tool-btn" onclick="window.app.htmlDecode()">Decode (Unescape)</button>
            <button class="tool-btn" onclick="document.getElementById('htmlInput').value=''">Clear</button>
            <div style="flex:1"></div>
            <button class="tool-btn btn-copy-tool" onclick="window.app.htmlCopy()">Copy Result</button>
        </div>

        <div class="tool-editor-wrap" style="grid-template-columns: 1fr;">
            <div class="editor-pane">
                <textarea class="code-area" id="htmlInput" placeholder="Enter text or HTML here..." style="min-height: 400px; background: var(--bg3); font-family: var(--font-mono); line-height: 1.6;"></textarea>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const input = document.getElementById('htmlInput');

    window.app.htmlEncode = () => {
        const val = input.value;
        if (!val) return;
        const div = document.createElement('div');
        div.innerText = val;
        input.value = div.innerHTML;
    };

    window.app.htmlDecode = () => {
        const val = input.value;
        if (!val) return;
        const div = document.createElement('div');
        div.innerHTML = val;
        input.value = div.innerText;
    };

    window.app.htmlCopy = () => {
        navigator.clipboard.writeText(input.value);
        alert("Copied!");
    };
}
