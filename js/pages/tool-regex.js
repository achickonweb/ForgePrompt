export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Regex Tester</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Test regular expressions securely in your browser.</p>

        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 24px;">
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Regular Expression</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 1.5rem;">/</span>
                    <input type="text" id="rxPattern" placeholder="[a-zA-Z]+" value="\\b\\w+\\b" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; flex: 1; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;" oninput="window.app.rxTest()">
                    <span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 1.5rem;">/</span>
                    <input type="text" id="rxFlags" placeholder="gmi" value="g" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; width: 60px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px; text-align: center;" oninput="window.app.rxTest()">
                </div>
                <div id="rxError" style="color: var(--red); font-size: .85rem; margin-top: 8px; display: none;">Invalid Regular Expression</div>
            </div>

            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Test String</label>
                <textarea id="rxText" style="min-height: 150px; background: var(--bg3); font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); color: var(--text); border-radius: 4px; resize: vertical;" oninput="window.app.rxTest()">Hello World 123!</textarea>
            </div>

            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Matches (JSON Output)</label>
                <textarea id="rxOut" readonly style="min-height: 150px; background: rgba(0,0,0,.5); font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); color: var(--accent); border-radius: 4px; resize: vertical;"></textarea>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const pat = document.getElementById('rxPattern');
    const flg = document.getElementById('rxFlags');
    const txt = document.getElementById('rxText');
    const out = document.getElementById('rxOut');
    const err = document.getElementById('rxError');

    window.app.rxTest = () => {
        const pattern = pat.value;
        const flags = flg.value;
        const text = txt.value;

        if(!pattern) {
            out.value = 'No pattern provided.';
            err.style.display = 'none';
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            err.style.display = 'none';

            if(flags.includes('g')) {
                const matches = [...text.matchAll(regex)];
                if(matches.length === 0) out.value = 'No matches found.';
                else out.value = JSON.stringify(matches.map(m => m[0]), null, 2);
            } else {
                const match = text.match(regex);
                if(!match) out.value = 'No match found.';
                else out.value = JSON.stringify(match, null, 2);
            }
        } catch(e) {
            err.style.display = 'block';
            err.textContent = e.message;
            out.value = '';
        }
    };

    window.app.rxTest();
}
