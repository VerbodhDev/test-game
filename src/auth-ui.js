import { signUp, signIn, signOut, getUser } from './supabase.js';

export class AuthUI {
    constructor(containerId = 'app') {
        this.container = document.getElementById(containerId);
        this.user = null;
        this.init();
    }

    async init() {
        this.user = await getUser();
        this.renderAuthButton();
    }

    renderAuthButton() {
        // Remove existing button if any
        const existingBtn = document.getElementById('auth-status-btn');
        if (existingBtn) existingBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'auth-status-btn';
        btn.className = 'pixel-btn pixel-btn-magenta fixed bottom-4 right-4 z-40 text-xs';

        if (this.user) {
            const username = this.user.email.split('@')[0];
            btn.textContent = `LOGOUT (${username})`;
            btn.onclick = () => this.handleLogout();
        } else {
            btn.textContent = 'LOGIN / SIGNUP';
            btn.onclick = () => this.showAuthModal();
        }

        this.container.appendChild(btn);
    }

    showAuthModal(mode = 'login') {
        // Remove existing modal if any
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) existingModal.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'auth-modal';
        backdrop.className = 'auth-modal-backdrop';

        const modalHTML = `
      <div class="auth-modal pixel-border-cyan">
        <h2 class="text-cyber-cyan text-center mb-8 pixel-text text-sm retro-glow">
          ${mode === 'login' ? 'PILOT LOGIN' : 'NEW RECRUIT'}
        </h2>
        
        <div id="auth-error" class="text-red-500 pixel-text text-xs mb-4 text-center hidden"></div>
        
        <input type="email" id="auth-email" class="auth-input" placeholder="EMAIL" autocomplete="email">
        <input type="password" id="auth-password" class="auth-input" placeholder="PASSWORD" autocomplete="current-password">
        
        <div class="flex flex-col gap-4 mt-6">
          <button id="auth-submit-btn" class="pixel-btn pixel-btn-cyan w-full">
            ${mode === 'login' ? 'LAUNCH' : 'ENLIST'}
          </button>
          
          <button id="auth-switch-mode" class="text-gray-400 pixel-text text-xs hover:text-white underline cursor-pointer">
            ${mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Login'}
          </button>
          
          <button id="auth-close-btn" class="text-red-500 pixel-text text-xs hover:text-red-400 mt-2 cursor-pointer">
            ABORT MISSION
          </button>
        </div>
      </div>
    `;

        backdrop.innerHTML = modalHTML;
        document.body.appendChild(backdrop);

        // Event Listeners
        document.getElementById('auth-close-btn').onclick = () => backdrop.remove();
        document.getElementById('auth-switch-mode').onclick = () => {
            this.showAuthModal(mode === 'login' ? 'signup' : 'login');
        };

        document.getElementById('auth-submit-btn').onclick = async () => {
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const errorDiv = document.getElementById('auth-error');

            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';

            if (!email || !password) {
                errorDiv.textContent = 'CREDENTIALS REQUIRED';
                errorDiv.classList.remove('hidden');
                return;
            }

            let result;
            if (mode === 'login') {
                result = await signIn(email, password);
            } else {
                result = await signUp(email, password);
            }

            if (result.error) {
                errorDiv.textContent = result.error.message.toUpperCase();
                errorDiv.classList.remove('hidden');
            } else {
                // Success
                this.user = await getUser(); // Refresh user state
                backdrop.remove();
                this.renderAuthButton();

                // If signing up, show welcome
                if (mode === 'signup') {
                    alert('WELCOME COMMANDER! PLEASE CHECK YOUR EMAIL TO VERIFY.');
                }
            }
        };
    }

    async handleLogout() {
        await signOut();
        this.user = null;
        this.renderAuthButton();
    }

    getUser() {
        return this.user;
    }
}
