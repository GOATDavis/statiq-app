from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["games"])
ml_router = APIRouter(tags=["ml-predictions"])  # No prefix for ML endpoints

# ============================================================================
# SCHEMAS
# ============================================================================

class GameLeader(BaseModel):
    """Individual player stat leader for a game"""
    player_id: str
    player_name: str
    jersey_number: int | None = None
    position: str

    # Passing stats
    passing_yards: int | None = None
    passing_completions: int | None = None
    passing_attempts: int | None = None
    passing_tds: int | None = None

    # Rushing stats
    rushing_yards: int | None = None
    rushing_carries: int | None = None
    rushing_tds: int | None = None

    # Receiving stats
    receiving_yards: int | None = None
    receptions: int | None = None
    receiving_tds: int | None = None

    # Defensive stats
    tackles: int | None = None
    sacks: float | None = None
    interceptions: int | None = None


class TeamLeaders(BaseModel):
    """Top performers for one team in a game"""
    team_id: str
    team_name: str
    team_mascot: str
    team_color: str | None = None

    passing: GameLeader | None = None
    rushing: GameLeader | None = None
    receiving: GameLeader | None = None
    tackles: GameLeader | None = None
    sacks: GameLeader | None = None


class GameLeadersResponse(BaseModel):
    """Game leaders for both teams"""
    game_id: str
    home_team: TeamLeaders
    away_team: TeamLeaders
    updated_at: str


class Analytics(BaseModel):
    """ML prediction analytics"""
    away_win_probability: float
    home_win_probability: float
    confidence: str  # "High", "Medium", "Low"
    last_updated: str


class Predictions(BaseModel):
    """Fan predictions"""
    away_percentage: float
    home_percentage: float
    total_votes: int


class GameDetailResponse(BaseModel):
    """Complete game detail with ML predictions and team info"""
    id: int
    home_team_id: int
    away_team_id: int
    home_team_name: str
    away_team_name: str
    home_team_mascot: str | None = None
    away_team_mascot: str | None = None
    home_score: int | None = None
    away_score: int | None = None
    quarter: str | None = None
    time_remaining: str | None = None
    is_live: bool = False
    classification: str | None = None
    location: str | None = None
    kickoff_at: str | None = None
    date: str | None = None
    broadcaster: str | None = None
    home_primary_color: str | None = None
    away_primary_color: str | None = None
    analytics: Analytics | None = None
    predictions: Predictions | None = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/games/{game_id}/leaders", response_model=GameLeadersResponse)
def get_game_leaders(game_id: str) -> GameLeadersResponse:
    """
    Get statistical leaders for both teams in a specific game.

    Returns the top performer in each category (passing, rushing, receiving, tackles, sacks)
    for both the home and away teams.

    NOTE: This currently serves mock data. When connected to the database, it should query
    the player_stats table filtered by game_id and aggregate by category.

    SQL Query Pattern:
    ```sql
    -- Passing leader
    SELECT player_id, player_name, jersey_number, position,
           SUM(passing_yards) as passing_yards,
           SUM(passing_completions) as passing_completions,
           SUM(passing_attempts) as passing_attempts,
           SUM(passing_tds) as passing_tds
    FROM player_stats
    WHERE game_id = :game_id AND team_id = :team_id
    GROUP BY player_id, player_name, jersey_number, position
    ORDER BY passing_yards DESC
    LIMIT 1;

    -- Rushing leader
    SELECT player_id, player_name, jersey_number, position,
           SUM(rushing_yards) as rushing_yards,
           SUM(rushing_carries) as rushing_carries,
           SUM(rushing_tds) as rushing_tds
    FROM player_stats
    WHERE game_id = :game_id AND team_id = :team_id
    GROUP BY player_id, player_name, jersey_number, position
    ORDER BY rushing_yards DESC
    LIMIT 1;

    -- Similar for receiving, tackles, sacks
    ```
    """

    # TODO: Replace with actual database query when player_stats table is populated
    # For now, return mock data based on game_id

    from datetime import datetime

    # Mock data for demo playoff game
    if game_id == "demo-playoff-001":
        return GameLeadersResponse(
            game_id=game_id,
            home_team=TeamLeaders(
                team_id="team-highland-park",
                team_name="Highland Park",
                team_mascot="Scots",
                team_color="#003087",
                passing=GameLeader(
                    player_id="player-hp-1",
                    player_name="C. Martinez",
                    jersey_number=7,
                    position="QB",
                    passing_yards=287,
                    passing_completions=21,
                    passing_attempts=31,
                    passing_tds=3,
                ),
                rushing=GameLeader(
                    player_id="player-hp-2",
                    player_name="B. Johnson",
                    jersey_number=22,
                    position="RB",
                    rushing_yards=142,
                    rushing_carries=22,
                    rushing_tds=2,
                ),
                receiving=GameLeader(
                    player_id="player-hp-3",
                    player_name="T. Harris",
                    jersey_number=1,
                    position="WR",
                    receiving_yards=156,
                    receptions=9,
                    receiving_tds=2,
                ),
                tackles=GameLeader(
                    player_id="player-hp-4",
                    player_name="J. Davis",
                    jersey_number=44,
                    position="LB",
                    tackles=14,
                ),
                sacks=GameLeader(
                    player_id="player-hp-5",
                    player_name="M. Thompson",
                    jersey_number=95,
                    position="DE",
                    sacks=2.0,
                ),
            ),
            away_team=TeamLeaders(
                team_id="team-midlothian",
                team_name="Midlothian",
                team_mascot="Panthers",
                team_color="#8B0000",
                passing=GameLeader(
                    player_id="player-mid-1",
                    player_name="D. Anderson",
                    jersey_number=10,
                    position="QB",
                    passing_yards=224,
                    passing_completions=18,
                    passing_attempts=26,
                    passing_tds=1,
                ),
                rushing=GameLeader(
                    player_id="player-mid-2",
                    player_name="J. Smith",
                    jersey_number=5,
                    position="RB",
                    rushing_yards=94,
                    rushing_carries=18,
                    rushing_tds=1,
                ),
                receiving=GameLeader(
                    player_id="player-mid-3",
                    player_name="M. Rodriguez",
                    jersey_number=11,
                    position="WR",
                    receiving_yards=118,
                    receptions=7,
                    receiving_tds=1,
                ),
                tackles=GameLeader(
                    player_id="player-mid-4",
                    player_name="K. Williams",
                    jersey_number=33,
                    position="LB",
                    tackles=12,
                ),
                sacks=GameLeader(
                    player_id="player-mid-5",
                    player_name="R. Jackson",
                    jersey_number=91,
                    position="DT",
                    sacks=1.5,
                ),
            ),
            updated_at=datetime.utcnow().isoformat(),
        )

    # Default mock data for other games
    return GameLeadersResponse(
        game_id=game_id,
        home_team=TeamLeaders(
            team_id="team-home",
            team_name="Home Team",
            team_mascot="Eagles",
            team_color="#003087",
            passing=GameLeader(
                player_id="player-1",
                player_name="J. Smith",
                jersey_number=7,
                position="QB",
                passing_yards=245,
                passing_completions=18,
                passing_attempts=28,
                passing_tds=2,
            ),
            rushing=GameLeader(
                player_id="player-2",
                player_name="M. Johnson",
                jersey_number=22,
                position="RB",
                rushing_yards=118,
                rushing_carries=19,
                rushing_tds=1,
            ),
            receiving=GameLeader(
                player_id="player-3",
                player_name="D. Brown",
                jersey_number=1,
                position="WR",
                receiving_yards=132,
                receptions=7,
                receiving_tds=1,
            ),
            tackles=GameLeader(
                player_id="player-4",
                player_name="C. Davis",
                jersey_number=44,
                position="LB",
                tackles=11,
            ),
            sacks=GameLeader(
                player_id="player-5",
                player_name="T. Williams",
                jersey_number=95,
                position="DE",
                sacks=1.5,
            ),
        ),
        away_team=TeamLeaders(
            team_id="team-away",
            team_name="Away Team",
            team_mascot="Panthers",
            team_color="#8B0000",
            passing=GameLeader(
                player_id="player-6",
                player_name="K. Anderson",
                jersey_number=10,
                position="QB",
                passing_yards=198,
                passing_completions=15,
                passing_attempts=24,
                passing_tds=1,
            ),
            rushing=GameLeader(
                player_id="player-7",
                player_name="R. Martinez",
                jersey_number=5,
                position="RB",
                rushing_yards=87,
                rushing_carries=16,
                rushing_tds=1,
            ),
            receiving=GameLeader(
                player_id="player-8",
                player_name="L. Thompson",
                jersey_number=11,
                position="WR",
                receiving_yards=94,
                receptions=6,
                receiving_tds=0,
            ),
            tackles=GameLeader(
                player_id="player-9",
                player_name="P. Rodriguez",
                jersey_number=33,
                position="LB",
                tackles=9,
            ),
            sacks=GameLeader(
                player_id="player-10",
                player_name="S. Jackson",
                jersey_number=91,
                position="DT",
                sacks=1.0,
            ),
        ),
        updated_at=datetime.utcnow().isoformat(),
    )


# ============================================================================
# ML PREDICTION ENDPOINTS (No /api/v1 prefix)
# ============================================================================

@ml_router.get("/games/{game_id}", response_model=GameDetailResponse)
def get_game_detail(game_id: int) -> GameDetailResponse:
    """
    Get complete game detail including ML predictions and team information.

    This endpoint is called by the frontend ML prediction UI.
    It joins game data with team names and includes analytics predictions.

    NOTE: Currently returns mock data. When connected to database:

    SQL Query Pattern:
    ```sql
    SELECT
        g.*,
        ht.name as home_team_name,
        ht.mascot as home_team_mascot,
        ht.primary_color as home_primary_color,
        at.name as away_team_name,
        at.mascot as away_team_mascot,
        at.primary_color as away_primary_color
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    WHERE g.id = :game_id;
    ```

    Then call ML prediction service to get analytics data.
    """

    # TODO: Replace with actual database query
    # For now, return mock data based on game_id

    # Mock data - replace with actual DB query
    if game_id == 8:
        # Game 8: Lovejoy vs Highland Park with real ML predictions
        return GameDetailResponse(
            id=8,
            home_team_id=16,
            away_team_id=15,
            home_team_name="Highland Park",
            away_team_name="Lovejoy",
            home_team_mascot="Scots",
            away_team_mascot="Leopards",
            home_score=None,
            away_score=None,
            quarter=None,
            time_remaining=None,
            is_live=False,
            classification="5A Division I",
            location="Highlander Stadium",
            kickoff_at="2025-11-15T19:00:00Z",
            date="2025-11-15",
            broadcaster="NFHS Network",
            home_primary_color="#003087",
            away_primary_color="#B4D836",
            analytics=Analytics(
                away_win_probability=94.3,
                home_win_probability=5.7,
                confidence="High",
                last_updated=datetime.utcnow().isoformat()
            ),
            predictions=Predictions(
                away_percentage=67.5,
                home_percentage=32.5,
                total_votes=1247
            )
        )

    # Default mock data for other games
    return GameDetailResponse(
        id=game_id,
        home_team_id=1,
        away_team_id=2,
        home_team_name="Home Team",
        away_team_name="Away Team",
        home_team_mascot="Eagles",
        away_team_mascot="Panthers",
        home_score=None,
        away_score=None,
        quarter=None,
        time_remaining=None,
        is_live=False,
        classification="6A Division I",
        location="Stadium",
        kickoff_at=datetime.utcnow().isoformat(),
        date=datetime.utcnow().date().isoformat(),
        broadcaster="Local TV",
        home_primary_color="#003087",
        away_primary_color="#8B0000",
        analytics=Analytics(
            away_win_probability=52.3,
            home_win_probability=47.7,
            confidence="Medium",
            last_updated=datetime.utcnow().isoformat()
        ),
        predictions=Predictions(
            away_percentage=55.0,
            home_percentage=45.0,
            total_votes=842
        )
    )
