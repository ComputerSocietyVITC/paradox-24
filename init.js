(function () {
  // Initialize Supabase client
  const SUPABASE_URL = "https://ddctemysdgslailkedsw.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3RlbXlzZGdzbGFpbGtlZHN3Iiwicm9sIjoimFub24iLCJpYXQiOjE3MTY5NjI4NzYsImV4cCI6MjAzMjUzODg3Nn0.eqTP9vbO-JnyF42oZuf4EMUwOXbTT9pgqRb2uH21X_U";
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function initializeGame() {
    const overworld = new Overworld({
      element: document.querySelector(".game-container"),
    });
    overworld.init();
  }

  // Initialize the game directly as authentication is handled in index.html
  initializeGame();
})();
