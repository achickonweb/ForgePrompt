export async function render() {
    return `
    <div class="section tool-section" style="margin: 0 auto; max-width: 800px;">
        <a href="/tools" class="back-link">← All Tools</a>
        <h1 class="page-title" style="font-size: 2.2rem; text-align: left; margin-top: 16px;">Text Counter</h1>
        <p style="color: var(--text-muted); margin-bottom: 32px;">Calculate characters, words, sentences, and reading time.</p>

        <div class="tc-stats-bar">
            <div class="tc-stat"><span class="tc-num" id="tc-chars">0</span><span class="tc-lbl">Characters</span></div>
            <div class="tc-stat"><span class="tc-num" id="tc-words">0</span><span class="tc-lbl">Words</span></div>
            <div class="tc-stat"><span class="tc-num" id="tc-sentences">0</span><span class="tc-lbl">Sentences</span></div>
            <div class="tc-stat"><span class="tc-num" id="tc-paragraphs">0</span><span class="tc-lbl">Paragraphs</span></div>
            <div class="tc-stat"><span class="tc-num" id="tc-lines">0</span><span class="tc-lbl">Lines</span></div>
            <div class="tc-stat"><span class="tc-num" id="tc-reading">0m</span><span class="tc-lbl">Reading Time</span></div>
        </div>

        <textarea class="code-area tc-textarea" id="tcInput" placeholder="Start typing or paste your text here..." oninput="window.app.tcProcess()"></textarea>
    </div>
    `;
}

export function init() {
    const input = document.getElementById('tcInput');
    
    window.app.tcProcess = () => {
        const text = input.value;
        const chars = text.length;
        const words = text.match(/\S+/g)?.length || 0;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 0;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 0;
        const lines = text.split(/\r*\n/).length || 1;
        if (!text) { lines = 0; }
        
        // Avg reading speed: 200 words per minute
        const readingMins = Math.ceil(words / 200);

        document.getElementById('tc-chars').textContent = chars;
        document.getElementById('tc-words').textContent = words;
        document.getElementById('tc-sentences').textContent = sentences;
        document.getElementById('tc-paragraphs').textContent = paragraphs;
        document.getElementById('tc-lines').textContent = lines;
        document.getElementById('tc-reading').textContent = readingMins + 'm';
    };
}
