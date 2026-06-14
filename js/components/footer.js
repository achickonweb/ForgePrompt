export function renderFooter() {
    return `
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="logo-bracket">[</span>ForgePrompt<span class="logo-bracket">]</span>
        <p>Real prompts. Real votes. No fakes.</p>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <h4>Explore</h4>
          <a href="/prompts?category=ChatGPT">ChatGPT</a>
          <a href="/prompts?category=Coding">Coding</a>
          <a href="/requests">Requests</a>
        </div>
        <div class="footer-col">
          <h4>Dev Tools</h4>
          <a href="/tools/json">JSON Formatter</a>
          <a href="/tools/base64">Base64 Codec</a>
          <a href="/tools">View All Tools</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 ForgePrompt &mdash; Community Platform</span>
    </div>
    `;
}
