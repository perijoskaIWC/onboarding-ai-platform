from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import AsyncAzureOpenAI
from sqlalchemy.exc import IntegrityError
from .core.config import settings
from .core.database import create_db_and_tables
from .models import user as _user_model  # noqa: F401
from .models import refresh_token as _rt_model  # noqa: F401
from .models import project as _project_model  # noqa: F401
from .models import project_assignment as _pa_model  # noqa: F401
from .models import document as _doc_model  # noqa: F401
from .models import document_chunk as _chunk_model  # noqa: F401
from .models import learning_path as _lp_model  # noqa: F401
from .models import learning_module as _lm_model  # noqa: F401
from .models import module_completion as _mc_model  # noqa: F401
from .models import learner_progress as _progress_model  # noqa: F401
from .models import quiz_attempt as _qa_model  # noqa: F401
from .models import question as _question_model  # noqa: F401
from .models import weekly_plan as _wp_model  # noqa: F401
from .models import adaptive_question as _aq_model  # noqa: F401
from .models import module_chunk as _mc2_model  # noqa: F401
from .api.auth import router as auth_router
from .api.admin.projects import router as admin_projects_router
from .api.admin import documents as _admin_docs_module
from .api.admin.learning_path import router as admin_lp_router
from .api.admin.quiz import router as admin_quiz_router
from .api.admin.analytics import router as admin_analytics_router
from .api.user.projects import router as user_projects_router
from .api.user.learning_path import router as user_lp_router
from .api.user.chat import router as user_chat_router
from .api.user.quiz import router as user_quiz_router
from .api.user.progress import router as user_progress_router
from .api.admin.weekly_plan import router as admin_weekly_plan_router
from .api.user.weekly_plan import router as user_weekly_plan_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.openai_client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    create_db_and_tables()
    yield
    await app.state.openai_client.close()


app = FastAPI(title="Onboarding AI Platform", lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "Resource already exists or constraint violated"})


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth_router, prefix="/api")
app.include_router(admin_projects_router, prefix="/api/admin")
app.include_router(_admin_docs_module.router, prefix="/api")
app.include_router(admin_lp_router, prefix="/api")
app.include_router(user_projects_router, prefix="/api/user")
app.include_router(user_lp_router, prefix="/api")
app.include_router(admin_quiz_router, prefix="/api")
app.include_router(admin_analytics_router, prefix="/api")
app.include_router(user_chat_router, prefix="/api")
app.include_router(user_quiz_router, prefix="/api")
app.include_router(user_progress_router, prefix="/api")
app.include_router(admin_weekly_plan_router, prefix="/api")
app.include_router(user_weekly_plan_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
