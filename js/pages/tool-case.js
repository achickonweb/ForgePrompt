export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Case Converter</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Convert text between different programming cases.</p>

        <div class="tool-controls" style="flex-wrap: wrap;">
            <button class="tool-btn" onclick="window.app.caseConvert('camel')">camelCase</button>
            <button class="tool-btn" onclick="window.app.caseConvert('snake')">snake_case</button>
            <button class="tool-btn" onclick="window.app.caseConvert('kebab')">kebab-case</button>
            <button class="tool-btn" onclick="window.app.caseConvert('pascal')">PascalCase</button>
            <button class="tool-btn" onclick="window.app.caseConvert('constant')">CONSTANT_CASE</button>
            <button class="tool-btn" onclick="window.app.caseConvert('lower')">lowercase</button>
            <button class="tool-btn" onclick="window.app.caseConvert('upper')">UPPERCASE</button>
            <div style="flex:1"></div>
            <button class="tool-btn btn-copy-tool" onclick="window.app.caseCopy()">Copy</button>
        </div>

        <div class="tool-editor-wrap" style="grid-template-columns: 1fr;">
            <div class="editor-pane">
                <textarea class="code-area" id="caseInput" placeholder="Enter text here..." style="min-height: 300px; background: var(--bg3); font-family: var(--font-mono); line-height: 1.6;"></textarea>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const input = document.getElementById('caseInput');

    const toWords = (str) => {
        return str.replace(/([a-z])([A-Z])/g, '$1 $2')
                  .replace(/[-_]/g, ' ')
                  .toLowerCase()
                  .split(' ')
                  .filter(w => w.length > 0);
    };

    window.app.caseConvert = (type) => {
        const val = input.value;
        if(!val) return;
        
        // Handle multiline by mapping over lines
        input.value = val.split('\\n').map(line => {
            if(!line.trim()) return line;
            const words = toWords(line);
            
            switch(type) {
                case 'camel': return words.map((w, i) => i===0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
                case 'snake': return words.join('_');
                case 'kebab': return words.join('-');
                case 'pascal': return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
                case 'constant': return words.join('_').toUpperCase();
                case 'lower': return line.toLowerCase();
                case 'upper': return line.toUpperCase();
                default: return line;
            }
        }).join('\\n');
    };

    window.app.caseCopy = () => {
        navigator.clipboard.writeText(input.value);
        alert("Copied!");
    };
}
