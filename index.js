document.addEventListener("DOMContentLoaded", () => {
    const SUPABASE_URL = "https://ddctemysdgslailkedsw.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3RlbXlzZGdzbGFpbGtlZHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5NjI4NzYsImV4cCI6MjAzMjUzODg3Nn0.eqTP9vbO-JnyF42oZuf4EMUwOXbTT9pgqRb2uH21X_U";
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
            console.error("Error signing in with Google:", error.message);
        }
    }

    async function checkAuth() {
        const { data: { session }, error } = await _supabase.auth.getSession();
        if (error) {
            console.error("Error checking session:", error.message);
            return;
        }
        if (session) {
            window.location.href = "game.html";
        }
    }

    const loginButton = document.getElementById("login-button");
    loginButton.addEventListener("click", () => {
        signInWithGoogle();
    });

    // Listen for authentication changes
    _supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            window.location.href = "game.html";
        }
    });

    // Check authentication status on page load
    checkAuth();
});
