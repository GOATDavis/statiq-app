from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["playoff-bracket"])

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class Team(BaseModel):
    id: int
    name: str
    mascot: str = ""


class PlayoffGame(BaseModel):
    id: int
    game_id: str
    region: int
    home_team: Team
    away_team: Team
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str  # "scheduled", "live", "final"
    kickoff_at: Optional[str] = None
    location: str = "TBD"
    notes: Optional[str] = None


class PlayoffRound(BaseModel):
    round: str
    games: list[PlayoffGame]


class PlayoffBracketResponse(BaseModel):
    conference: str
    rounds: list[PlayoffRound]


# ============================================================================
# ROUTES
# ============================================================================

@router.get("/playoff-bracket", response_model=PlayoffBracketResponse)
def get_playoff_bracket(
    conference: str = Query("5A D1", description="Conference/classification (e.g., '5A D1', '6A D2')")
) -> PlayoffBracketResponse:
    """
    Get playoff bracket data for a specific conference.
    Returns all rounds and games in the playoff bracket.

    NOTE: This currently serves mock data. When connected to the database, it should:
    - Query playoff_games table filtered by conference
    - Group games by round
    - Include team details and current scores
    - Show bracket progression
    """

    # Mock playoff bracket data for 5A D1
    mock_rounds = [
        PlayoffRound(
            round="Bi-District",
            games=[
                PlayoffGame(
                    id=218,
                    game_id="G1",
                    region=1,
                    home_team=Team(id=1, name="Highland Park", mascot="Scots"),
                    away_team=Team(id=2, name="Midlothian", mascot="Panthers"),
                    home_score=28,
                    away_score=24,
                    status="final",
                    kickoff_at="2025-11-08T19:00:00Z",
                    location="AT&T Stadium",
                    notes="Highland Park advances"
                ),
                PlayoffGame(
                    id=219,
                    game_id="G2",
                    region=1,
                    home_team=Team(id=3, name="Lovejoy", mascot="Leopards"),
                    away_team=Team(id=4, name="Frisco Reedy", mascot="Lions"),
                    home_score=35,
                    away_score=21,
                    status="final",
                    kickoff_at="2025-11-08T19:30:00Z",
                    location="McKinney ISD Stadium",
                    notes="Lovejoy advances"
                ),
                PlayoffGame(
                    id=220,
                    game_id="G3",
                    region=2,
                    home_team=Team(id=5, name="Texas High", mascot="Tigers"),
                    away_team=Team(id=6, name="Mount Pleasant", mascot="Tigers"),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at="2025-11-15T19:00:00Z",
                    location="Christus Trinity Mother Frances Rose Stadium",
                    notes=None
                ),
                PlayoffGame(
                    id=221,
                    game_id="G4",
                    region=2,
                    home_team=Team(id=7, name="Longview", mascot="Lobos"),
                    away_team=Team(id=8, name="Tyler", mascot="Lions"),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at="2025-11-15T19:30:00Z",
                    location="Lobo Stadium",
                    notes=None
                ),
            ]
        ),
        PlayoffRound(
            round="Area",
            games=[
                PlayoffGame(
                    id=222,
                    game_id="G5",
                    region=1,
                    home_team=Team(id=1, name="Highland Park", mascot="Scots"),
                    away_team=Team(id=3, name="Lovejoy", mascot="Leopards"),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at="2025-11-22T19:00:00Z",
                    location="AT&T Stadium",
                    notes="Winner of G1 vs Winner of G2"
                ),
                PlayoffGame(
                    id=223,
                    game_id="G6",
                    region=2,
                    home_team=Team(id=5, name="TBD", mascot=""),
                    away_team=Team(id=7, name="TBD", mascot=""),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at=None,
                    location="TBD",
                    notes="Winner of G3 vs Winner of G4"
                ),
            ]
        ),
        PlayoffRound(
            round="Regional",
            games=[
                PlayoffGame(
                    id=224,
                    game_id="G7",
                    region=1,
                    home_team=Team(id=0, name="TBD", mascot=""),
                    away_team=Team(id=0, name="TBD", mascot=""),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at=None,
                    location="TBD",
                    notes="Winner of G5 vs Winner of G6"
                ),
            ]
        ),
        PlayoffRound(
            round="State Semifinal",
            games=[
                PlayoffGame(
                    id=225,
                    game_id="G8",
                    region=1,
                    home_team=Team(id=0, name="TBD", mascot=""),
                    away_team=Team(id=0, name="TBD", mascot=""),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at=None,
                    location="AT&T Stadium",
                    notes="Regional Champions"
                ),
            ]
        ),
        PlayoffRound(
            round="State Championship",
            games=[
                PlayoffGame(
                    id=226,
                    game_id="G9",
                    region=1,
                    home_team=Team(id=0, name="TBD", mascot=""),
                    away_team=Team(id=0, name="TBD", mascot=""),
                    home_score=None,
                    away_score=None,
                    status="scheduled",
                    kickoff_at=None,
                    location="AT&T Stadium",
                    notes="State Championship Game"
                ),
            ]
        ),
    ]

    return PlayoffBracketResponse(
        conference=conference,
        rounds=mock_rounds
    )
