export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Base64 Codec</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Encode or decode text to and from Base64 format instantly.</p>

        <div class="b64-tabs">
            <button class="tab-btn active" id="tab-encode" onclick="window.app.setMode('encode')">Encode</button>
            <button class="tab-btn" id="tab-decode" onclick="window.app.setMode('decode')">Decode</button>
        </div>

        <div class="tool-editor-wrap">
            <div class="editor-pane">
                <div class="pane-label" id="lbl-input">Text Input</div>
                <textarea class="code-area" id="b64Input" placeholder="Type or paste here..." oninput="window.app.b64Process()"></textarea>
            </div>
            <div class="editor-divider">
                <button class="transform-btn" onclick="window.app.b64Swap()">⇄</button>
            </div>
            <div class="editor-pane">
                <div class="pane-label" id="lbl-output" style="justify-content: space-between;">
                    Base64 Output
                    <button class="btn-primary" style="padding: 2px 8px; font-size: .7rem;" onclick="window.app.b64Copy()">Copy</button>
                </div>
                <div class="code-area code-output" id="b64Output" style="background: rgba(0,0,0,0.2);"></div>
            </div>
        </div>

        <div class="tool-status" id="b64Status" style="display:none;"></div>
    </div>
    `;
}

export function init() {
    let mode = 'encode';
    const input = document.getElementById('b64Input');
    const output = document.getElementById('b64Output');
    const lblIn = document.getElementById('lbl-input');
    const lblOut = document.getElementById('lbl-output');
    const status = document.getElementById('b64Status');

    window.app.setMode = (newMode) => {
        mode = newMode;
        document.getElementById('tab-encode').classList.toggle('active', mode === 'encode');
        document.getElementById('tab-decode').classList.toggle('active', mode === 'decode');
        
        lblIn.textContent = mode === 'encode' ? 'Text Input' : 'Base64 Input';
        lblOut.childNodes[0].textContent = mode === 'encode' ? 'Base64 Output ' : 'Text Output ';
        
        window.app.b64Process();
    };

    window.app.b64Swap = () => {
        input.value = output.textContent;
        window.app.setMode(mode === 'encode' ? 'decode' : 'encode');
    };

    window.app.b64Process = () => {
        const val = input.value;
        status.style.display = 'none';
        
        if (!val) {
            output.textContent = '';
            return;
        }

        try {
            if (mode === 'encode') {
                output.textContent = btoa(unescape(encodeURIComponent(val)));
            } else {
                output.textContent = decodeURIComponent(escape(atob(val)));
            }
        } catch (e) {
            output.textContent = '';
            status.style.display = 'block';
            status.className = 'tool-status status-error';
            status.textContent = 'Invalid input for decoding.';
        }
    };

    window.app.b64Copy = () => {
        navigator.clipboard.writeText(output.textContent);
        const orig = lblOut.childNodes[1].textContent;
        lblOut.childNodes[1].textContent = 'Copied!';
        setTimeout(() => lblOut.childNodes[1].textContent = orig, 2000);
    };
}
