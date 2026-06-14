export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Base Converter</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Convert numbers instantly between Decimal, Binary, Hexadecimal, and Octal.</p>

        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px;">
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Decimal (Base 10)</label>
                <input type="text" id="base10" class="base-input" data-base="10" placeholder="e.g. 42" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;">
            </div>
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Binary (Base 2)</label>
                <input type="text" id="base2" class="base-input" data-base="2" placeholder="e.g. 101010" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;">
            </div>
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Hexadecimal (Base 16)</label>
                <input type="text" id="base16" class="base-input" data-base="16" placeholder="e.g. 2A" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;">
            </div>
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Octal (Base 8)</label>
                <input type="text" id="base8" class="base-input" data-base="8" placeholder="e.g. 52" style="font-family: var(--font-mono); font-size: 1.2rem; padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px;">
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const inputs = document.querySelectorAll('.base-input');
    
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const base = parseInt(e.target.dataset.base);
            
            if (!val) {
                inputs.forEach(i => i.value = '');
                return;
            }

            try {
                // Parse to big int from the source base
                let decValue;
                if(base === 16) decValue = BigInt('0x' + val);
                else if(base === 2) decValue = BigInt('0b' + val);
                else if(base === 8) decValue = BigInt('0o' + val);
                else decValue = BigInt(val);

                // Update others
                inputs.forEach(i => {
                    if (i !== e.target) {
                        i.value = decValue.toString(parseInt(i.dataset.base)).toUpperCase();
                    }
                });
            } catch (err) {
                // Invalid input for that base
            }
        });
    });
}
