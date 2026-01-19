from fastapi import APIRouter, Query
from datetime import datetime, date

from app.schemas.dashboard import (
    DashboardPayload, Team, LastGame, LastGameScore, UpcomingGame,
    PlayerAvailability, AvailabilityItem, KeyPerformer, TeamStats, CoachNote
)

router = APIRouter(prefix="/api/v1", tags=["dashboard"])

@router.get("/dashboard", response_model=DashboardPayload)
def get_dashboard(team_id: str | None = Query(default=None, description="Optional team UUID")) -> DashboardPayload:
    """
    Returns the full DashboardPayload structure.
    NOTE: This currently serves sample data.
    """

    team = Team(
        id=team_id or "8f2c1b0d-3a9d-41c6-9f02-8e4e5e1c56a4",
        name="Joshua",
        mascot="Owls",
        city="Joshua, TX",
        record="3-2",
        logo_url="https://statiq.app/assets/teams/joshua-owls.png",
    )

    last_game = LastGame(
        date=date(2025, 10, 18),
        opponent="Cleburne Yellowjackets",
        location="Home",
        score=LastGameScore(home=24, away=21),
        result="W",
        summary="QB J. Miller threw for 212 yards and 2 TDs as Joshua edged Cleburne 24-21.",
    )

    upcoming_game = UpcomingGame(
        date=date(2025, 11, 14),
        opponent="Burleson Elks",
        location="Away",
        kickoff_time=datetime.fromisoformat("2025-11-14T19:00:00+00:00"),
        preview="District rivalry on the road; emphasis on third-down efficiency.",
    )

    # Determine if today is game day (same date as upcoming game)
    today = date.today()
    is_game_day = upcoming_game is not None and upcoming_game.date == today

    player_availability = PlayerAvailability(
        cleared=[
            AvailabilityItem(number=7,  name="J. Miller", position="QB"),
            AvailabilityItem(number=22, name="T. Reed",   position="RB"),
            AvailabilityItem(number=10, name="K. Lopez",  position="WR"),
        ],
        limited=[
            AvailabilityItem(number=11, name="S. King",   position="WR", note="ankle sprain"),
        ],
        out=[
            AvailabilityItem(number=54, name="M. Hall",   position="LB", note="concussion protocol"),
        ],
    )

    key_performers = [
        KeyPerformer(
            player_id="9bcd14a1-22df-4ad2-bfa8-0a72a3cc9e2e",
            name="T. Reed",
            position="RB",
            statline="18 rushes, 112 yds, 1 TD",
        ),
        KeyPerformer(
            player_id="a642a97c-83b4-4b19-ae7e-1b665b6e2c58",
            name="J. Miller",
            position="QB",
            statline="14/21, 212 yds, 2 TD, 0 INT",
        ),
    ]

    team_stats = TeamStats(
        points_per_game=26.4,
        yards_per_game=328,
        turnover_margin="+3",
        third_down_pct=0.46,
        red_zone_efficiency=0.71,
    )

    coach_notes = [
        CoachNote(
            id="bfda90e2-1b45-4c52-99f1-c129cb3f34c7",
            author="Coach Davis",
            body="Strong week of practice. Focus on tackling angles.",
            created_at=datetime.fromisoformat("2025-10-21T15:42:00+00:00"),
        ),
        CoachNote(
            id="ae9cb7f1-7821-4bc2-8c91-0d4cfb4a2b73",
            author="DC Smith",
            body="Burleson lives on quick slants—press outside, help inside.",
            created_at=datetime.fromisoformat("2025-10-22T09:12:00+00:00"),
        ),
    ]

    return DashboardPayload(
        is_game_day=is_game_day,
        team=team,
        last_game=last_game,
        upcoming_game=upcoming_game,
        player_availability=player_availability,
        key_performers=key_performers,
        team_stats=team_stats,
        coach_notes=coach_notes,
    )