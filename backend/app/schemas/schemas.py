from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


# ── Auth / Users ─────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(default="", max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    xp: int
    level: str
    streak_days: int


# ── Content ──────────────────────────────────────────────────
class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: str
    content: str
    order_index: int
    xp_reward: int
    completed: bool = False


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    description: str
    level: str
    category: str
    icon: str
    lesson_count: int = 0
    completed_count: int = 0


class CourseDetailOut(CourseOut):
    lessons: list[LessonOut] = []


class QuizQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    options: list[str]


class QuizOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    topic: str
    level: str
    description: str
    question_count: int = 0


class QuizDetailOut(QuizOut):
    questions: list[QuizQuestionOut] = []


class QuizSubmission(BaseModel):
    answers: dict[int, int]  # question_id -> chosen option index


class QuizResultOut(BaseModel):
    score: int
    total: int
    xp_earned: int
    corrections: list["QuestionCorrection"]


class QuestionCorrection(BaseModel):
    question_id: int
    correct_index: int
    explanation: str
    was_correct: bool


class ChallengeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    description: str
    level: str
    kind: str
    xp_reward: int
    payload: dict
    completed: bool = False


class ChallengeSubmission(BaseModel):
    answer: int  # selected option index


class ReferenceChannelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    description: str
    editing_style: str
    learn: list[str]
    recommended_videos: list
    accent: str
    youtube_url: str = ""


# ── Dashboard ────────────────────────────────────────────────
class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    kind: str
    description: str
    xp: int
    created_at: datetime


class DashboardOut(BaseModel):
    user: UserOut
    xp_to_next_level: int
    next_level: str
    level_progress_pct: int
    courses_completed: int
    courses_total: int
    quizzes_taken: int
    challenges_completed: int
    daily_challenge: ChallengeOut | None
    recent_activity: list[ActivityOut]


# ── AI ───────────────────────────────────────────────────────
class ScriptRequest(BaseModel):
    script: str = Field(min_length=1, max_length=20000)


class BrollScene(BaseModel):
    scene: str
    broll_ideas: list[str]
    camera_angles: list[str]
    motion_graphics: list[str]
    text_overlays: list[str]


class BrollResponse(BaseModel):
    provider: str
    scenes: list[BrollScene]


class StoryScore(BaseModel):
    name: str
    score: int
    note: str


class StorytellingResponse(BaseModel):
    provider: str
    overall: int
    scores: list[StoryScore]
    suggestions: list[str]


class SlideAnalysisRequest(BaseModel):
    # Either a text description of the slide and/or an uploaded image
    # (data URL or raw base64). At least one must be provided.
    notes: str = Field(default="", max_length=8000)
    image_base64: str | None = Field(default=None, max_length=12_000_000)
    image_name: str | None = Field(default=None, max_length=300)


class SlideSuggestion(BaseModel):
    title: str
    detail: str
    impact: str  # high | medium | low


class ImageMetrics(BaseModel):
    width: int
    height: int
    aspect_ratio: str
    orientation: str
    megapixels: float
    brightness: int          # 0-100
    contrast: int            # 0-100
    colorfulness: int        # 0-100
    palette: list[str]       # hex swatches


class SlideAnalysisResponse(BaseModel):
    provider: str
    source: str = "text"     # text | image
    image_metrics: ImageMetrics | None = None
    first_impression: str
    layout: str
    typography: str
    clarity: str
    consistency: str
    suggestions: list[SlideSuggestion]


# ── Leaderboard ──────────────────────────────────────────────
class LeaderboardEntry(BaseModel):
    rank: int
    full_name: str
    xp: int
    level: str


QuizResultOut.model_rebuild()
