window.addEventListener("load", async () => {
  const SUPABASE_URL = "https://ddctemysdgslailkedsw.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3RlbXlzZGdzbGFpbGtlZHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5NjI4NzYsImV4cCI6MjAzMjUzODg3Nn0.eqTP9vbO-JnyF42oZuf4EMUwOXbTT9pgqRb2uH21X_U";
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const {
    data: { session },
  } = await _supabase.auth.getSession();
  if (session) {
    const userId = session.user.id;

    const overworld = new Overworld({
      element: document.querySelector(".game-container"),
    });
    const pauseMenu = new PauseMenu({ overworld, supabase: _supabase, userId });
    window.pauseMenu = pauseMenu;
    pauseMenu.init();

    const titleScreen = new TitleScreen({overworld : overworld, pauseMenu: pauseMenu});
    titleScreen.createMenu();

    // if (!(pauseMenu.loadGame(true))) {  
    //   console.log("NO save, sed")
    //   overworld.init();
    // }

  } 
  else {
    console.error("User is not authenticated.");
    window.location.href = "index.html";
  }
});
