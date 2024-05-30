(function () {
  // Initialize Supabase client
  const SUPABASE_URL = "https://ddctemysdgslailkedsw.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3RlbXlzZGdzbGFpbGtlZHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5NjI4NzYsImV4cCI6MjAzMjUzODg3Nn0.eqTP9vbO-JnyF42oZuf4EMUwOXbTT9pgqRb2uH21X_U";
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  async function signInWithGoogle() {
    try {
      const { error } = await _supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) {
        console.error("Error logging in:", error.message);
      }
    } catch (error) {
      console.error("Error signing in with google:", error.message);
    }
  }

  async function checkAuth() {
    const {
      data: { session },
    } = await _supabase.auth.getSession();
    if (session) {
      initializeGame();
    } else {
      displayLoginScreen();
    }
  }

  function displayLoginScreen() {
    const loginContainer = document.createElement("div");
    loginContainer.classList.add("login-container");
    loginContainer.innerHTML = `
      <div class="login-content">
        <h1>Login With</h1>
        <button id="login-button">
        <span>G</span>
        <span>o</span>
        <span>o</span>
        <span>g</span>
        <span>l</span>
        <span>e</span>
        <span> </span>
        </button>
      </div>
    `;
    document.body.appendChild(loginContainer);

    const loginButton = document.getElementById("login-button");
    loginButton.addEventListener("click", () => {
      signInWithGoogle();
    });

    // Listen for authentication changes
    _supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        document.body.removeChild(loginContainer);
        initializeGame();
      }
    });
  }

  function initializeGame() {
    const overworld = new Overworld({
      element: document.querySelector(".game-container"),
    });
    overworld.init();
  }

  // Check authentication status on page load
  checkAuth();
})();
