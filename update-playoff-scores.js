// Script to update 5A-D1 playoff scores for Week 1 (Bi-District)
// Run with: node update-playoff-scores.js

const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

const games = [
  // Region 1
  { home: "El Dorado", away: "Amarillo", homeScore: 77, awayScore: 76, winner: "home" },
  { home: "Richland", away: "OD Wyatt", homeScore: 77, awayScore: 43, winner: "home" },
  { home: "Abilene", away: "Bel Air", homeScore: 84, awayScore: 25, winner: "home" },
  { home: "Denton Ryan", away: "Chisholm Trail", homeScore: 59, awayScore: 7, winner: "home" },
  { home: "Aledo", away: "Saginaw", homeScore: 80, awayScore: 12, winner: "home" },
  { home: "Tascosa", away: "Parkland", homeScore: 84, awayScore: 13, winner: "home" },
  { home: "Arlington Heights", away: "Brewer", homeScore: 36, awayScore: 23, winner: "home" },
  { home: "Monterey", away: "Americas", homeScore: 50, awayScore: 32, winner: "home" },
  
  // Region 2
  { home: "Lone Star", away: "North Mesquite", homeScore: 49, awayScore: 6, winner: "home" },
  { home: "Georgetown", away: "Centennial", homeScore: 41, awayScore: 11, winner: "home" },
  { home: "West Mesquite", away: "Frisco", homeScore: 28, awayScore: 24, winner: "home" },
  { home: "Midlothian", away: "East View", homeScore: 36, awayScore: 16, winner: "home" },
  { home: "Highland Park", away: "Lake Belton", homeScore: 56, awayScore: 13, winner: "home" },
  { home: "Reedy", away: "Creekview", homeScore: 24, awayScore: 3, winner: "home" },
  { home: "Cedar Park", away: "Tyler", homeScore: 50, awayScore: 43, winner: "home" },
  { home: "Wakeland", away: "Newman Smith", homeScore: 28, awayScore: 12, winner: "home" },
  
  // Region 3
  { home: "Port Arthur Memorial", away: "Galena Park", homeScore: 42, awayScore: 0, winner: "home" },
  { home: "A&M Consolidated", away: "Crosby", homeScore: 27, awayScore: 26, winner: "home" },
  { home: "Beaumont United", away: "Madison", homeScore: 27, awayScore: 19, winner: "home" },
  { home: "College Station", away: "Angleton", homeScore: 42, awayScore: 23, winner: "home" },
  { home: "Weiss", away: "La Porte", homeScore: 42, awayScore: 35, winner: "home" },
  { home: "Lufkin", away: "Westbury", homeScore: 35, awayScore: 10, winner: "home" },
  { home: "Anderson", away: "Friendswood", homeScore: 35, awayScore: 34, winner: "home" },
  { home: "Barbers Hill", away: "Waltrip", homeScore: 57, awayScore: 7, winner: "home" },
  
  // Region 4
  { home: "Smithson Valley", away: "Southside", homeScore: 49, awayScore: 0, winner: "home" },
  { home: "Corpus Christi Veterans Memorial", away: "Vela", homeScore: 31, awayScore: 26, winner: "home" },
  { home: "Pieper", away: "Jay", homeScore: 33, awayScore: 14, winner: "home" },
  { home: "Flour Bluff", away: "McAllen", homeScore: 45, awayScore: 7, winner: "home" },
  { home: "Pharr-San Juan-Alamo", away: "Mission", homeScore: 65, awayScore: 14, winner: "home" },
  { home: "Boerne-Champion", away: "Southwest", homeScore: 41, awayScore: 14, winner: "home" },
  { home: "McAllen Memorial", away: "Harlingen South", homeScore: 35, awayScore: 21, winner: "home" },
  { home: "New Braunfels", away: "Nixon", homeScore: 49, awayScore: 14, winner: "home" },
];

async function updateGame(game) {
  try {
    // First, fetch all games to find the matching game ID
    const response = await fetch(
      `${API_BASE}/playoff-bracket?conference=5A D1`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bracket: ${response.status}`);
    }
    
    const bracketData = await response.json();
    
    // Find the Bi-District round
    const biDistrictRound = bracketData.rounds.find(r => r.round === 'Bi-District');
    if (!biDistrictRound) {
      console.log(`No Bi-District round found`);
      return;
    }
    
    // Find matching game by team names
    const matchingGame = biDistrictRound.games.find(g => 
      (g.home_team.name === game.home || g.home_team.name.includes(game.home)) &&
      (g.away_team.name === game.away || g.away_team.name.includes(game.away))
    );
    
    if (!matchingGame) {
      console.log(`Game not found: ${game.home} vs ${game.away}`);
      return;
    }
    
    console.log(`Updating game ${matchingGame.id}: ${game.home} ${game.homeScore} - ${game.awayScore} ${game.away}`);
    
    // Update the game with scores
    const updateResponse = await fetch(
      `${API_BASE}/games/${matchingGame.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          home_score: game.homeScore,
          away_score: game.awayScore,
          status: 'final',
        }),
      }
    );
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update game: ${updateResponse.status}`);
    }
    
    console.log(`✓ Updated: ${game.home} ${game.homeScore} - ${game.awayScore} ${game.away}`);
    
  } catch (error) {
    console.error(`Error updating ${game.home} vs ${game.away}:`, error.message);
  }
}

async function updateAllGames() {
  console.log('Starting to update 5A-D1 playoff scores...\n');
  
  for (const game of games) {
    await updateGame(game);
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✓ All games updated!');
}

updateAllGames();
