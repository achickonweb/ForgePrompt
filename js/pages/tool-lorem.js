export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Lorem Ipsum Generator</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Generate dummy placeholder text for your designs and mockups.</p>

        <div class="tool-controls" style="align-items: center;">
            <label for="loremParas" style="color: var(--text); font-weight: bold;">Paragraphs:</label>
            <input type="number" id="loremParas" value="3" min="1" max="50" style="width: 80px; padding: 6px; background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 4px;">
            
            <button class="tool-btn active" onclick="window.app.loremGenerate()">Generate</button>
            <div style="flex:1"></div>
            <button class="tool-btn btn-copy-tool" onclick="window.app.loremCopy()">Copy Text</button>
        </div>

        <div class="tool-editor-wrap" style="grid-template-columns: 1fr;">
            <div class="editor-pane">
                <textarea class="code-area" id="loremOutput" readonly style="min-height: 400px; background: var(--bg3); font-family: sans-serif; line-height: 1.6;"></textarea>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const out = document.getElementById('loremOutput');
    const paras = document.getElementById('loremParas');

    const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    window.app.loremGenerate = () => {
        let count = parseInt(paras.value) || 3;
        let result = [];
        for (let i = 0; i < count; i++) {
            result.push(loremText);
        }
        out.value = result.join('\\n\\n');
    };

    window.app.loremCopy = () => {
        navigator.clipboard.writeText(out.value);
        alert("Copied!");
    };

    window.app.loremGenerate();
}
