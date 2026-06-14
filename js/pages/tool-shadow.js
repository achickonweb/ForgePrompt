export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Box Shadow Generator</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Visually create CSS box-shadows.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start;">
            <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Horizontal Offset</span> <span id="shXVal">0px</span>
                    </label>
                    <input type="range" id="shX" min="-50" max="50" value="0" style="width: 100%;" oninput="window.app.updateShadow()">
                </div>
                <div>
                    <label style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Vertical Offset</span> <span id="shYVal">10px</span>
                    </label>
                    <input type="range" id="shY" min="-50" max="50" value="10" style="width: 100%;" oninput="window.app.updateShadow()">
                </div>
                <div>
                    <label style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Blur Radius</span> <span id="shBlurVal">30px</span>
                    </label>
                    <input type="range" id="shBlur" min="0" max="100" value="30" style="width: 100%;" oninput="window.app.updateShadow()">
                </div>
                <div>
                    <label style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Spread Radius</span> <span id="shSpreadVal">0px</span>
                    </label>
                    <input type="range" id="shSpread" min="-50" max="50" value="0" style="width: 100%;" oninput="window.app.updateShadow()">
                </div>
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Shadow Color</label>
                    <input type="color" id="shColor" value="#00ff88" style="width: 100%; height: 40px; padding: 0; border: none; border-radius: 4px; cursor: pointer; background: none;" oninput="window.app.updateShadow()">
                </div>
                <div>
                    <label style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Opacity</span> <span id="shOpacityVal">0.2</span>
                    </label>
                    <input type="range" id="shOpacity" min="0" max="1" step="0.05" value="0.2" style="width: 100%;" oninput="window.app.updateShadow()">
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 32px;">
                <div style="background: var(--bg2); border-radius: var(--radius-lg); border: 1px solid var(--border); height: 300px; display: flex; align-items: center; justify-content: center;">
                    <div id="shPreview" style="width: 150px; height: 150px; background: var(--bg3); border-radius: 12px; box-shadow: 0px 10px 30px rgba(0, 255, 136, 0.2);"></div>
                </div>

                <div style="position: relative;">
                    <textarea id="shOutput" readonly style="width: 100%; min-height: 80px; background: var(--bg3); border: 1px solid var(--border); color: var(--accent); padding: 16px; font-family: var(--font-mono); border-radius: 4px; resize: none;"></textarea>
                    <button class="tool-btn" style="position: absolute; right: 12px; bottom: 16px;" onclick="navigator.clipboard.writeText(document.getElementById('shOutput').value); alert('Copied!');">Copy</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const x = document.getElementById('shX');
    const y = document.getElementById('shY');
    const blur = document.getElementById('shBlur');
    const spread = document.getElementById('shSpread');
    const color = document.getElementById('shColor');
    const opacity = document.getElementById('shOpacity');
    
    const preview = document.getElementById('shPreview');
    const output = document.getElementById('shOutput');

    const hexToRgb = (hex) => {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return \`\${r}, \${g}, \${b}\`;
    };

    window.app.updateShadow = () => {
        document.getElementById('shXVal').textContent = x.value + 'px';
        document.getElementById('shYVal').textContent = y.value + 'px';
        document.getElementById('shBlurVal').textContent = blur.value + 'px';
        document.getElementById('shSpreadVal').textContent = spread.value + 'px';
        document.getElementById('shOpacityVal').textContent = opacity.value;

        const rgba = \`rgba(\${hexToRgb(color.value)}, \${opacity.value})\`;
        const shadow = \`\${x.value}px \${y.value}px \${blur.value}px \${spread.value}px \${rgba}\`;
        
        preview.style.boxShadow = shadow;
        output.value = \`box-shadow: \${shadow};\\n-webkit-box-shadow: \${shadow};\\n-moz-box-shadow: \${shadow};\`;
    };

    window.app.updateShadow();
}
