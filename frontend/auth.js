class Auth {
  constructor() {
      this.isAuthenticated = false;
      this.user = null;
      this.checkAuthState();
  }

  checkAuthState() {
      const user = localStorage.getItem('user');
      if (user) {
          this.isAuthenticated = true;
          this.user = JSON.parse(user);
          this.updateUI();
      }
  }

  async login() {
      try {
          // Simulate Google OAuth login
          const mockUser = {
              id: 'user123',
              name: 'Test User',
              email: 'test@example.com',
              avatar: null
          };

          this.isAuthenticated = true;
          this.user = mockUser;
          localStorage.setItem('user', JSON.stringify(mockUser));
          this.updateUI();
          return true;
      } catch (error) {
          console.error('Login failed:', error);
          return false;
      }
  }

  logout() {
      this.isAuthenticated = false;
      this.user = null;
      localStorage.removeItem('user');
      this.updateUI();
  }

  updateUI() {
      const avatarButton = document.querySelector('.avatar-button');
      if (this.isAuthenticated && this.user) {
          avatarButton.textContent = this.user.name.charAt(0);
          avatarButton.setAttribute('title', this.user.name);
      } else {
          avatarButton.textContent = 'G';
          avatarButton.setAttribute('title', 'Sign in');
      }
  }

  async requestMediaPermissions() {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true
          });
          return stream;
      } catch (error) {
          console.error('Media permission request failed:', error);
          return null;
      }
  }
}

// Initialize auth
const auth = new Auth();

// Add click handler to avatar button
document.querySelector('.avatar-button').addEventListener('click', () => {
  if (!auth.isAuthenticated) {
      auth.login();
  } else {
      auth.logout();
  }
});