export async function render() {
    return `
    <div class="section" style="max-width: 480px; padding-top: 100px;">
        <div class="modal-box" style="margin: 0 auto; box-shadow: 0 12px 40px rgba(0,0,0,.5);">
            <h2 class="modal-title">Log In</h2>
            <form id="loginForm" onsubmit="event.preventDefault(); window.app.handleLogin();">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" required placeholder="you@example.com" />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required />
                </div>
                <div class="submit-feedback status-error" id="loginError" style="display:none; margin-bottom: 16px;"></div>
                <div class="modal-actions" style="justify-content: space-between; align-items: center;">
                    <a href="/register" class="back-link" style="margin:0;">Need an account?</a>
                    <button type="submit" class="btn-primary" id="loginBtn">Log in →</button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function init() {
    window.app.handleLogin = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        const err = document.getElementById('loginError');
        
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        err.style.display = 'none';
        
        const result = await window.app.authManager.login(email, password);
        
        if (!result.success) {
            err.textContent = result.error;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Log in →';
        }
    };
}
