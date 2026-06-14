export function renderNavbar(user = null, isAdmin = false) {
    return `
    <nav class="nav-inner">
      <a href="/" class="nav-logo">
        <span class="logo-bracket">[</span>ForgePrompt<span class="logo-bracket">]</span>
      </a>

      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/prompts" class="nav-link">Prompts</a></li>
        <li><a href="/requests" class="nav-link">Requests</a></li>
        <li><a href="/tools" class="nav-link">Dev Tools</a></li>
      </ul>

      <div class="nav-right">
        ${user ? `
            ${isAdmin ? `<a href="/admin" class="btn-ghost" style="color: var(--accent);">[Admin]</a>` : ''}
            <a href="/profile" class="btn-ghost">Profile</a>
            <button onclick="window.app.authManager.logout()" class="btn-ghost">Log out</button>
            <a href="/prompt-editor" class="nav-submit-btn">+ Submit</a>
        ` : `
            <a href="/login" class="btn-ghost">Log in</a>
            <a href="/register" class="nav-submit-btn">Sign up</a>
        `}
      </div>
    </nav>
    `;
}
