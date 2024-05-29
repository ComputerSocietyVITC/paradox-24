(function () {
  // Initialize Supabase client
  const SUPABASE_URL = "https://elyjkbpahblqfdfmkjck.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseWprYnBhaGJscWZkZm1ramNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5MDgxNzAsImV4cCI6MjAzMjQ4NDE3MH0.SBe4n-q37RrcTA4CtYO9K2AZiZwLnp4mHmOqpxbt5Uc";
  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

  async function signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
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
    } = await supabase.auth.getSession();
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
    supabase.auth.onAuthStateChange((_event, session) => {
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

  // Supabase client creation
  function createSupabaseClient(url, key) {
    return {
      auth: {
        signInWithOAuth: async ({ provider }) => {
          const response = await fetch(
            `${url}/auth/v1/oauth/authorize?provider=${provider}`,
            {
              method: "GET",
              headers: {
                apikey: key,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error signing in with ${provider}: ${response.statusText}`
            );
          }

          const data = await response.json();
          return data;
        },
        getSession: async () => {
          const session = localStorage.getItem("supabase.auth.token");
          return { data: { session: session ? JSON.parse(session) : null } };
        },
        onAuthStateChange: (callback) => {
          window.addEventListener("storage", () => {
            const session = localStorage.getItem("supabase.auth.token");
            callback(null, session ? JSON.parse(session) : null);
          });
        },
      },
    };
  }
})();
