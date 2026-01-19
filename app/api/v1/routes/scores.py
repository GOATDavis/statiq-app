from fastapi import APIRouter, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["scores"])

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class LiveGame(BaseModel):
    id: str
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    home_team_mascot: str
    away_team_mascot: str
    home_score: int
    away_score: int
    quarter: str  # "1Q", "2Q", "3Q", "4Q", "FINAL", "HALFTIME"
    time_remaining: str  # "12:34" or "HALFTIME"
    is_live: bool
    district: str
    classification: str  # "6A", "5A", "4A", etc.
    location: str
    started_at: str  # ISO timestamp
    updated_at: str  # ISO timestamp
    # Team colors
    home_primary_color: Optional[str] = None
    home_background_color: Optional[str] = None
    away_primary_color: Optional[str] = None
    away_background_color: Optional[str] = None
    # Team rankings (for Score Feed display)
    home_state_rank: Optional[int] = None  # State ranking (e.g., #3 in Texas 6A)
    away_state_rank: Optional[int] = None
    home_national_rank: Optional[int] = None  # National ranking (for top teams)
    away_national_rank: Optional[int] = None
    # Broadcaster/Network info
    broadcaster: Optional[str] = None  # "ESPN+", "NFHS Network", "Local TV", etc.


class FinishedGame(BaseModel):
    id: str
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    home_team_mascot: str
    away_team_mascot: str
    home_score: int
    away_score: int
    date: str  # "2025-11-01"
    time: str  # "7:30 PM"
    location: str
    district: str
    classification: str
    final_status: str  # "FINAL", "FINAL/OT", etc.
    # Team colors
    home_primary_color: Optional[str] = None
    home_background_color: Optional[str] = None
    away_primary_color: Optional[str] = None
    away_background_color: Optional[str] = None
    # Team records
    home_record: Optional[str] = None
    away_record: Optional[str] = None


class UpcomingGame(BaseModel):
    id: str
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    home_team_mascot: str
    away_team_mascot: str
    date: str  # "2025-11-08"
    time: str  # "7:00 PM"
    location: str
    district: str
    classification: str
    week: int
    # Team colors
    home_primary_color: Optional[str] = None
    home_background_color: Optional[str] = None
    away_primary_color: Optional[str] = None
    away_background_color: Optional[str] = None
    # Team records
    home_record: Optional[str] = None
    away_record: Optional[str] = None


class ScoresResponse(BaseModel):
    live_games: list[LiveGame]
    upcoming_games: list[UpcomingGame]
    finished_games: list[FinishedGame]
    updated_at: str


# ============================================================================
# ROUTES
# ============================================================================

@router.get("/scores", response_model=ScoresResponse)
def get_scores(
    classification: Optional[str] = Query(None, description="Filter by classification (6A, 5A, etc.)"),
    date_from: Optional[str] = Query(None, description="Filter games from this date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter games to this date (ISO format)"),
    following_only: Optional[bool] = Query(False, description="Only return games for followed teams")
) -> ScoresResponse:
    """
    Get scores for live, finished, and upcoming games.
    Includes rankings and broadcaster information for ESPN-style Score Feed.

    NOTE: This currently serves mock data. When connected to the database, it should:
    - Query the games table with appropriate filters
    - Join with teams table to get rankings and colors
    - Include broadcaster information from the games table
    - Apply user's following preferences if following_only=true
    """

    now = datetime.utcnow()

    # Mock data with rankings and broadcaster info
    live_games = [
        LiveGame(
            id="demo-playoff-001",
            home_team_id="team-highland-park",
            away_team_id="team-midlothian",
            home_team_name="Highland Park",
            away_team_name="Midlothian",
            home_team_mascot="Scots",
            away_team_mascot="Panthers",
            home_score=28,
            away_score=24,
            quarter="4Q",
            time_remaining="3:47",
            is_live=True,
            district="Playoffs",
            classification="5A",
            location="AT&T Stadium, Arlington",
            started_at=now.isoformat(),
            updated_at=now.isoformat(),
            home_primary_color="#003087",
            away_primary_color="#8B0000",
            home_state_rank=3,  # #3 in Texas 5A
            away_state_rank=7,  # #7 in Texas 5A
            broadcaster="NFHS Network",
        ),
        LiveGame(
            id="live-6a-matchup",
            home_team_id="team-southlake-carroll",
            away_team_id="team-allen",
            home_team_name="Southlake Carroll",
            away_team_name="Allen",
            home_team_mascot="Dragons",
            away_team_mascot="Eagles",
            home_score=21,
            away_score=17,
            quarter="3Q",
            time_remaining="8:12",
            is_live=True,
            district="6A Region II",
            classification="6A",
            location="Dragon Stadium",
            started_at=now.isoformat(),
            updated_at=now.isoformat(),
            home_primary_color="#003F2D",
            away_primary_color="#006747",
            home_state_rank=1,  # #1 in Texas 6A
            away_state_rank=2,  # #2 in Texas 6A
            home_national_rank=5,  # #5 nationally
            away_national_rank=8,  # #8 nationally
            broadcaster="ESPN+",
        ),
    ]

    finished_games = [
        FinishedGame(
            id="finished-001",
            home_team_id="team-duncanville",
            away_team_id="team-desoto",
            home_team_name="Duncanville",
            away_team_name="DeSoto",
            home_team_mascot="Panthers",
            away_team_mascot="Eagles",
            home_score=42,
            away_score=35,
            date="2025-11-08",
            time="7:30 PM",
            location="Panther Stadium",
            district="6A Region I",
            classification="6A",
            final_status="FINAL",
            home_primary_color="#000000",
            away_primary_color="#00205B",
            home_record="9-1",
            away_record="8-2",
        ),
    ]

    upcoming_games = [
        UpcomingGame(
            id="upcoming-001",
            home_team_id="team-jesuit",
            away_team_id="team-bishop-lynch",
            home_team_name="Jesuit",
            away_team_name="Bishop Lynch",
            home_team_mascot="Rangers",
            away_team_mascot="Friars",
            date="2025-11-15",
            time="7:00 PM",
            location="Postell Stadium",
            district="TAPPS D1 District 1",
            classification="TAPPS",
            week=11,
            home_primary_color="#00205B",
            away_primary_color="#8B0000",
            home_record="7-2",
            away_record="6-3",
        ),
    ]

    # Apply classification filter if provided
    if classification:
        live_games = [g for g in live_games if g.classification == classification]
        finished_games = [g for g in finished_games if g.classification == classification]
        upcoming_games = [g for g in upcoming_games if g.classification == classification]

    return ScoresResponse(
        live_games=live_games,
        finished_games=finished_games,
        upcoming_games=upcoming_games,
        updated_at=now.isoformat(),
    )
