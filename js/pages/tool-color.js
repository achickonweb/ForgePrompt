export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Color Converter</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Convert between HEX, RGB, and HSL formats instantly.</p>

        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 32px;">
                <input type="color" id="colorPicker" value="#00ff88" style="width: 100px; height: 100px; padding: 0; border: none; border-radius: 8px; cursor: pointer; background: none;">
                <div style="flex: 1;">
                    <div style="margin-bottom: 12px;">
                        <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">HEX</label>
                        <input type="text" id="hexInput" value="#00ff88" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 8px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;" oninput="window.app.colorUpdateFromHex(this.value)">
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">RGB</label>
                    <input type="text" id="rgbInput" readonly style="font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;">
                </div>
                <div>
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">HSL</label>
                    <input type="text" id="hslInput" readonly style="font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;">
                </div>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const picker = document.getElementById('colorPicker');
    const hexIn = document.getElementById('hexInput');
    const rgbIn = document.getElementById('rgbInput');
    const hslIn = document.getElementById('hslInput');

    const hexToRgb = (hex) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1]+hex[1], 16);
            g = parseInt(hex[2]+hex[2], 16);
            b = parseInt(hex[3]+hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1,3), 16);
            g = parseInt(hex.substring(3,5), 16);
            b = parseInt(hex.substring(5,7), 16);
        }
        return [r, g, b];
    };

    const rgbToHsl = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
    };

    const updateAll = (hex) => {
        try {
            if(!hex.startsWith('#')) hex = '#' + hex;
            const [r, g, b] = hexToRgb(hex);
            if(isNaN(r)) return;
            picker.value = hex.substring(0,7);
            hexIn.value = hex;
            rgbIn.value = \`rgb(\${r}, \${g}, \${b})\`;
            const [h, s, l] = rgbToHsl(r, g, b);
            hslIn.value = \`hsl(\${h}, \${s}%, \${l}%)\`;
        } catch(e) {}
    };

    window.app.colorUpdateFromHex = (val) => updateAll(val);
    picker.addEventListener('input', (e) => updateAll(e.target.value));

    updateAll('#00ff88');
}
