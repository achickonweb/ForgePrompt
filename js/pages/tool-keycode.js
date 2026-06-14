export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">KeyCode Info</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Press any key to see its JavaScript event properties.</p>

        <div style="background: var(--bg2); padding: 48px; border-radius: var(--radius-lg); border: 1px solid var(--accent); text-align: center; margin-bottom: 32px; box-shadow: 0 0 40px var(--accent-dim);">
            <h2 id="kcMain" style="font-size: 4rem; color: var(--accent); font-family: var(--font-mono); margin-bottom: 16px;">Press any key</h2>
            <p id="kcSub" style="color: var(--text-muted);">Focus on this page and press a key.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
            <div style="background: var(--bg3); padding: 24px; border-radius: var(--radius); border: 1px solid var(--border); text-align: center;">
                <div style="font-size: .8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">event.key</div>
                <div id="kcKey" style="font-size: 1.5rem; font-family: var(--font-mono); color: var(--text);">-</div>
            </div>
            <div style="background: var(--bg3); padding: 24px; border-radius: var(--radius); border: 1px solid var(--border); text-align: center;">
                <div style="font-size: .8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">event.code</div>
                <div id="kcCode" style="font-size: 1.5rem; font-family: var(--font-mono); color: var(--text);">-</div>
            </div>
            <div style="background: var(--bg3); padding: 24px; border-radius: var(--radius); border: 1px solid var(--border); text-align: center;">
                <div style="font-size: .8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">event.keyCode</div>
                <div id="kcKeyCode" style="font-size: 1.5rem; font-family: var(--font-mono); color: var(--text);">-</div>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const main = document.getElementById('kcMain');
    const sub = document.getElementById('kcSub');
    const keyEl = document.getElementById('kcKey');
    const codeEl = document.getElementById('kcCode');
    const keyCodeEl = document.getElementById('kcKeyCode');

    const handler = (e) => {
        const main = document.getElementById('kcMain');
        if(!main) {
            window.removeEventListener('keydown', handler);
            return;
        }
        e.preventDefault();
        main.textContent = e.keyCode;
        
        const sub = document.getElementById('kcSub');
        const keyEl = document.getElementById('kcKey');
        const codeEl = document.getElementById('kcCode');
        const keyCodeEl = document.getElementById('kcKeyCode');

        sub.textContent = e.key === ' ' ? '(Space character)' : e.key;
        keyEl.textContent = e.key;
        codeEl.textContent = e.code;
        keyCodeEl.textContent = e.keyCode;
    };

    window.addEventListener('keydown', handler);

    // Cleanup when leaving route
    window.app.cleanupKeyCode = () => window.removeEventListener('keydown', handler);
}
