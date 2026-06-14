export async function render() {
    return `
    <div class="section" style="max-width: 480px; padding-top: 100px;">
        <div class="modal-box" style="margin: 0 auto; box-shadow: 0 12px 40px rgba(0,0,0,.5);">
            <h2 class="modal-title">Create an Account</h2>
            <form id="registerForm" onsubmit="event.preventDefault(); window.app.handleRegister();">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="reg-email" required placeholder="you@example.com" />
                </div>
                <div class="form-group">
                    <label>Password (min 6 characters)</label>
                    <input type="password" id="reg-password" required minlength="6" />
                </div>
                <div class="submit-feedback status-error" id="regError" style="display:none; margin-bottom: 16px;"></div>
                <div class="modal-actions" style="justify-content: space-between; align-items: center;">
                    <a href="/login" class="back-link" style="margin:0;">Already have an account?</a>
                    <button type="submit" class="btn-primary" id="regBtn">Sign up →</button>
                </div>
            </form>
        </div>
    </div>
    `;
}

export function init() {
    window.app.handleRegister = async () => {
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('regBtn');
        const err = document.getElementById('regError');
        
        btn.disabled = true;
        btn.textContent = 'Signing up...';
        err.style.display = 'none';
        
        const result = await window.app.authManager.register(email, password);
        
        if (!result.success) {
            err.textContent = result.error;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Sign up →';
        }
    };
}
