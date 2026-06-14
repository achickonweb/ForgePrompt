export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Hash Verifier</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Verify if a string matches a specific hash or check checksum equality.</p>

        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 24px;">
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">String 1 / Expected Hash</label>
                <input type="text" id="bc1" placeholder="e.g. 5d41402abc4b2a76b9719d911017c592" style="font-family: var(--font-mono); font-size: 1rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;" oninput="window.app.bcCompare()">
            </div>
            
            <div style="text-align: center; color: var(--text-muted); font-size: 1.5rem;">⇅</div>

            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">String 2 / Provided Hash</label>
                <input type="text" id="bc2" placeholder="e.g. 5d41402abc4b2a76b9719d911017c592" style="font-family: var(--font-mono); font-size: 1rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;" oninput="window.app.bcCompare()">
            </div>

            <div id="bcResult" style="margin-top: 16px; padding: 24px; border-radius: var(--radius); text-align: center; font-size: 1.5rem; font-weight: bold; background: rgba(0,0,0,.3); border: 1px solid var(--border); color: var(--text-muted);">
                Waiting for input...
            </div>
            <p style="text-align:center; font-size: .8rem; color: var(--text-dim);">Note: Strict Equality Check. Ignores trailing whitespaces.</p>
        </div>
    </div>
    `;
}

export function init() {
    const bc1 = document.getElementById('bc1');
    const bc2 = document.getElementById('bc2');
    const res = document.getElementById('bcResult');

    window.app.bcCompare = () => {
        const v1 = bc1.value.trim();
        const v2 = bc2.value.trim();

        if(!v1 || !v2) {
            res.style.color = 'var(--text-muted)';
            res.style.background = 'rgba(0,0,0,.3)';
            res.style.borderColor = 'var(--border)';
            res.textContent = 'Waiting for input...';
            return;
        }

        if(v1 === v2) {
            res.style.color = 'var(--accent)';
            res.style.background = 'rgba(0,255,136,.1)';
            res.style.borderColor = 'var(--accent)';
            res.textContent = 'MATCH ✓';
        } else {
            res.style.color = 'var(--red)';
            res.style.background = 'rgba(255,71,87,.1)';
            res.style.borderColor = 'rgba(255,71,87,.5)';
            res.textContent = 'NO MATCH ✗';
        }
    };
}
