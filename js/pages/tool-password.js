export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 600px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Password Generator</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Create secure, complex passwords. Generated entirely locally.</p>

        <div style="background: var(--bg2); padding: 32px; border: 1px solid var(--border); border-radius: var(--radius-lg);">
            <div style="display: flex; gap: 12px; margin-bottom: 32px;">
                <input type="text" id="pwdResult" readonly style="flex: 1; font-family: var(--font-mono); font-size: 1.5rem; padding: 12px 16px; background: var(--bg3); border: 1px solid var(--border-hi); border-radius: 8px; color: var(--accent); text-align: center;" />
                <button class="btn-primary" onclick="window.app.pwdCopy()">Copy</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label>Length: <span id="pwdLenLbl">16</span></label>
                    <input type="range" id="pwdLength" min="8" max="64" value="16" oninput="window.app.updatePwdLen(this.value)" style="width: 200px;" />
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="pwdUpper" checked /> <label for="pwdUpper">Uppercase (A-Z)</label>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="pwdLower" checked /> <label for="pwdLower">Lowercase (a-z)</label>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="pwdNum" checked /> <label for="pwdNum">Numbers (0-9)</label>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" id="pwdSym" checked /> <label for="pwdSym">Symbols (!@#$%^&*)</label>
                </div>
            </div>

            <button class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem;" onclick="window.app.pwdGenerate()">Generate Password</button>
        </div>
    </div>
    `;
}

export function init() {
    window.app.updatePwdLen = (val) => {
        document.getElementById('pwdLenLbl').textContent = val;
    };

    window.app.pwdGenerate = () => {
        const len = parseInt(document.getElementById('pwdLength').value);
        const upper = document.getElementById('pwdUpper').checked;
        const lower = document.getElementById('pwdLower').checked;
        const num = document.getElementById('pwdNum').checked;
        const sym = document.getElementById('pwdSym').checked;

        const charUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const charLower = "abcdefghijklmnopqrstuvwxyz";
        const charNum = "0123456789";
        const charSym = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        let chars = "";
        if (upper) chars += charUpper;
        if (lower) chars += charLower;
        if (num) chars += charNum;
        if (sym) chars += charSym;

        if (!chars) {
            alert("Please select at least one character type.");
            return;
        }

        let password = "";
        const array = new Uint32Array(len);
        window.crypto.getRandomValues(array);
        for (let i = 0; i < len; i++) {
            password += chars[array[i] % chars.length];
        }

        document.getElementById('pwdResult').value = password;
    };

    window.app.pwdCopy = () => {
        const res = document.getElementById('pwdResult');
        if (!res.value) return;
        navigator.clipboard.writeText(res.value);
        alert('Password copied to clipboard!');
    };

    // Generate initial password
    window.app.pwdGenerate();
}
