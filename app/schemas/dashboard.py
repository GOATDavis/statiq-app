from __future__ import annotations
from typing import List, Optional, Literal
from datetime import datetime, date
from pydantic import BaseModel, HttpUrl, Field


class Team(BaseModel):
    id: str
    name: str
    mascot: str
    city: Optional[str] = None
    record: Optional[str] = None
    logo_url: Optional[HttpUrl] = None


class LastGameScore(BaseModel):
    home: int
    away: int


class LastGame(BaseModel):
    date: date
    opponent: str
    location: Literal["Home", "Away", "Neutral"]
    score: LastGameScore
    result: Literal["W", "L", "T"]
    summary: Optional[str] = None


class UpcomingGame(BaseModel):
    date: date
    opponent: str
    location: Literal["Home", "Away", "Neutral"]
    kickoff_time: Optional[datetime] = None
    preview: Optional[str] = None


class AvailabilityItem(BaseModel):
    number: int
    name: str
    position: Optional[str] = None
    note: Optional[str] = None


class PlayerAvailability(BaseModel):
    cleared: List[AvailabilityItem] = Field(default_factory=list)
    limited: List[AvailabilityItem] = Field(default_factory=list)
    out: List[AvailabilityItem] = Field(default_factory=list)


class KeyPerformer(BaseModel):
    player_id: str
    name: str
    position: Optional[str] = None
    statline: str


class TeamStats(BaseModel):
    points_per_game: float
    yards_per_game: int
    turnover_margin: str
    third_down_pct: float
    red_zone_efficiency: float


class CoachNote(BaseModel):
    id: str
    author: str
    body: str
    created_at: datetime


class DashboardPayload(BaseModel):
    is_game_day: bool = False
    team: Team
    last_game: Optional[LastGame] = None
    upcoming_game: Optional[UpcomingGame] = None
    player_availability: PlayerAvailability = Field(default_factory=PlayerAvailability)
    key_performers: List[KeyPerformer] = Field(default_factory=list)
    team_stats: Optional[TeamStats] = None
    coach_notes: List[CoachNote] = Field(default_factory=list)