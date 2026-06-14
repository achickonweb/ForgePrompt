export async function render() {
    const tools = [
        { id: 'json', icon: '{}', name: 'JSON Formatter', desc: 'Format, validate, and minify JSON data.', tags: ['formatter', 'validator'] },
        { id: 'base64', icon: '64', name: 'Base64 Encoder', desc: 'Encode and decode Base64 strings safely.', tags: ['encoder', 'decoder'] },
        { id: 'password', icon: '***', name: 'Password Generator', desc: 'Generate secure, random passwords.', tags: ['security', 'generator'] },
        { id: 'uuid', icon: 'ID', name: 'UUID Generator', desc: 'Bulk generate v4 UUIDs instantly.', tags: ['generator', 'uuid'] },
        { id: 'text', icon: 'Aa', name: 'Text Counter', desc: 'Count characters, words, lines, and reading time.', tags: ['text', 'utility'] },
        { id: 'url', icon: '%20', name: 'URL Encoder', desc: 'Safely encode and decode URL components.', tags: ['encoder', 'url'] },
        { id: 'hash', icon: '#', name: 'Hash Generator', desc: 'Generate SHA-1, SHA-256, and SHA-512 hashes natively.', tags: ['security', 'hash'] },
        { id: 'jwt', icon: 'JWT', name: 'JWT Decoder', desc: 'Decode JSON Web Tokens offline and securely.', tags: ['security', 'jwt'] },
        { id: 'lorem', icon: '¶', name: 'Lorem Ipsum', desc: 'Generate dummy text for your designs and layouts.', tags: ['generator', 'text'] },
        { id: 'color', icon: '🎨', name: 'Color Converter', desc: 'Convert between HEX, RGB, and HSL formats.', tags: ['css', 'design'] },
        { id: 'unix', icon: '⌚', name: 'Epoch Converter', desc: 'Convert Unix timestamps to human-readable dates.', tags: ['time', 'utility'] },
        { id: 'base', icon: '10', name: 'Base Converter', desc: 'Convert numbers between Dec, Bin, Hex, and Oct.', tags: ['math', 'converter'] },
        { id: 'html', icon: '<>', name: 'HTML Entities', desc: 'Escape and unescape HTML special characters.', tags: ['encoder', 'html'] },
        { id: 'case', icon: 'aA', name: 'Case Converter', desc: 'Convert text between camelCase, snake_case, etc.', tags: ['text', 'converter'] },
        { id: 'uri', icon: '🌐', name: 'URL Parser', desc: 'Extract host, path, and query params from a URL.', tags: ['url', 'utility'] },
        { id: 'keycode', icon: '⌨️', name: 'KeyCode Info', desc: 'Press any key to see its JS event key and code.', tags: ['js', 'events'] },
        { id: 'shadow', icon: '⬛', name: 'Box Shadow Generator', desc: 'Visually create CSS box-shadows.', tags: ['css', 'generator'] },
        { id: 'gradient', icon: '🌈', name: 'Gradient Generator', desc: 'Generate linear gradients and CSS code.', tags: ['css', 'generator'] },
        { id: 'regex', icon: '/.*/', name: 'Regex Tester', desc: 'Test regular expressions against strings natively.', tags: ['regex', 'js'] },
        { id: 'bcrypt', icon: '🛡️', name: 'Bcrypt/Hash Verifier', desc: 'Verify string hashes and checksums offline.', tags: ['security', 'hash'] }
    ];

    return `
    <div class="page-hero">
      <div class="page-hero-inner">
        <h1 class="page-title">Developer Tools</h1>
        <p class="page-sub">20 Essential utilities for developers, completely free and running offline in your browser.</p>
      </div>
    </div>

    <div class="section">
      <div class="tools-grid">
        ${tools.map(tool => `
        <a href="/tools/${tool.id}" class="tool-card tool-card--lg">
            <div class="tool-icon-lg">${tool.icon}</div>
            <div class="tool-info">
                <h3>${tool.name}</h3>
                <p>${tool.desc}</p>
            </div>
            <div class="tool-tags">
                ${tool.tags.map(t => `<span>${t}</span>`).join('')}
            </div>
            <div class="tool-arrow-lg">→</div>
        </a>
        `).join('')}
      </div>

      <div style="margin-top: 60px; padding: 32px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg); text-align: center;">
        <h3 style="margin-bottom: 12px; color: var(--accent);">Looking for AI Prompts?</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">ForgePrompt is more than just tools. It's a community of developers sharing the best prompts for ChatGPT, Claude, and Midjourney.</p>
        <a href="/prompts" class="btn-primary">Browse Prompt Library</a>
      </div>
    </div>
    `;
}

export function init() {}
