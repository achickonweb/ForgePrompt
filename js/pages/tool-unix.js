export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 900px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Unix Epoch Converter</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Convert Unix timestamps to human-readable dates and vice-versa.</p>

        <div style="background: var(--bg2); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Current Unix Timestamp (Seconds)</label>
                <div style="display: flex; gap: 12px;">
                    <input type="text" id="currentTs" readonly style="font-family: var(--font-mono); font-size: 1.5rem; padding: 12px; background: var(--bg3); border: 1px solid var(--border); color: var(--accent); border-radius: 4px; width: 250px; text-align: center;">
                </div>
            </div>

            <hr style="border: 0; border-top: 1px solid var(--border); margin: 32px 0;">

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                <div>
                    <h3 style="margin-bottom: 16px; color: var(--text);">Timestamp to Date</h3>
                    <input type="number" id="tsInput" placeholder="Enter timestamp..." style="font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px; margin-bottom: 16px;" oninput="window.app.unixToDate()">
                    <div id="tsOutput" style="font-family: var(--font-mono); color: var(--accent); font-size: .9rem;"></div>
                </div>

                <div>
                    <h3 style="margin-bottom: 16px; color: var(--text);">Date to Timestamp</h3>
                    <input type="datetime-local" id="dateInput" style="font-family: var(--font-mono); padding: 12px; width: 100%; border: 1px solid var(--border); background: var(--bg3); color: var(--text); border-radius: 4px; margin-bottom: 16px;" onchange="window.app.dateToUnix()">
                    <div id="dateOutput" style="font-family: var(--font-mono); color: var(--accent); font-size: .9rem;"></div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    const curTs = document.getElementById('currentTs');
    const tsIn = document.getElementById('tsInput');
    const tsOut = document.getElementById('tsOutput');
    const dateIn = document.getElementById('dateInput');
    const dateOut = document.getElementById('dateOutput');

    setInterval(() => {
        if(curTs) curTs.value = Math.floor(Date.now() / 1000);
    }, 1000);

    window.app.unixToDate = () => {
        const val = parseInt(tsIn.value);
        if(isNaN(val)) { tsOut.textContent = ''; return; }
        // Handle ms vs s
        const isMs = val > 1000000000000;
        const d = new Date(isMs ? val : val * 1000);
        tsOut.textContent = "GMT: " + d.toUTCString() + "\\nLocal: " + d.toLocaleString();
    };

    window.app.dateToUnix = () => {
        const val = dateIn.value;
        if(!val) { dateOut.textContent = ''; return; }
        const d = new Date(val);
        dateOut.textContent = "Seconds: " + Math.floor(d.getTime() / 1000) + "\\nMillis: " + d.getTime();
    };
}
