export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Gradient Generator</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Visually create CSS linear gradients.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start;">
            <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Color 1</label>
                    <input type="color" id="grC1" value="#00ff88" style="width: 100%; height: 40px; padding: 0; border: none; border-radius: 4px; cursor: pointer; background: none;" oninput="window.app.updateGradient()">
                </div>
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Color 2</label>
                    <input type="color" id="grC2" value="#00d4ff" style="width: 100%; height: 40px; padding: 0; border: none; border-radius: 4px; cursor: pointer; background: none;" oninput="window.app.updateGradient()">
                </div>
                <div>
                    <label style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Angle</span> <span id="grAngleVal">90°</span>
                    </label>
                    <input type="range" id="grAngle" min="0" max="360" value="90" style="width: 100%;" oninput="window.app.updateGradient()">
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 32px;">
                <div id="grPreview" style="background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: var(--radius-lg); border: 1px solid var(--border); height: 250px;"></div>

                <div style="position: relative;">
                    <textarea id="grOutput" readonly style="width: 100%; min-height: 80px; background: var(--bg3); border: 1px solid var(--border); color: var(--accent); padding: 16px; font-family: var(--font-mono); border-radius: 4px; resize: none;"></textarea>
                    <button class="tool-btn" style="position: absolute; right: 12px; bottom: 16px;" onclick="navigator.clipboard.writeText(document.getElementById('grOutput').value); alert('Copied!');">Copy</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const c1 = document.getElementById('grC1');
    const c2 = document.getElementById('grC2');
    const angle = document.getElementById('grAngle');
    const preview = document.getElementById('grPreview');
    const output = document.getElementById('grOutput');

    window.app.updateGradient = () => {
        document.getElementById('grAngleVal').textContent = angle.value + '°';
        const grad = \`linear-gradient(\${angle.value}deg, \${c1.value}, \${c2.value})\`;
        preview.style.background = grad;
        output.value = \`background: \${c1.value};\\nbackground: \${grad};\`;
    };

    window.app.updateGradient();
}
