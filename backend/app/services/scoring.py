from datetime import datetime, timezone
from sqlmodel import Session, select, func

from ..models.learner_progress import LearnerProgress
from ..models.learning_path import LearningPath
from ..models.learning_module import LearningModule
from ..models.module_completion import ModuleCompletion
from ..models.quiz_attempt import QuizAttempt


def compute_readiness(quiz_avg: float, module_completion_pct: float) -> float:
    return round((quiz_avg * 0.7) + (module_completion_pct * 0.3), 4)


def refresh_learner_progress(learner_id: str, project_id: str, session: Session) -> LearnerProgress:
    path = session.exec(
        select(LearningPath)
        .where(LearningPath.project_id == project_id, LearningPath.learner_id == learner_id)
        .order_by(LearningPath.generated_at.desc())
    ).first()

    modules_total = 0
    modules_completed = 0

    if path:
        modules_total = session.exec(
            select(func.count()).where(LearningModule.learning_path_id == path.id)
        ).one()
        completed_ids = session.exec(
            select(ModuleCompletion.module_id)
            .join(LearningModule, LearningModule.id == ModuleCompletion.module_id)
            .where(
                LearningModule.learning_path_id == path.id,
                ModuleCompletion.learner_id == learner_id,
            )
        ).all()
        modules_completed = len(set(completed_ids))

    attempts = session.exec(
        select(QuizAttempt).where(
            QuizAttempt.learner_id == learner_id,
            QuizAttempt.project_id == project_id,
        )
    ).all()
    quiz_avg = (sum(a.score for a in attempts) / len(attempts)) if attempts else 0.0

    module_pct = (modules_completed / modules_total) if modules_total else 0.0
    readiness = compute_readiness(quiz_avg, module_pct)

    progress = session.exec(
        select(LearnerProgress).where(
            LearnerProgress.learner_id == learner_id,
            LearnerProgress.project_id == project_id,
        )
    ).first()

    if not progress:
        progress = LearnerProgress(learner_id=learner_id, project_id=project_id)

    progress.quiz_avg = round(quiz_avg, 4)
    progress.modules_completed = modules_completed
    progress.modules_total = modules_total
    progress.readiness_score = readiness
    progress.updated_at = datetime.now(timezone.utc)

    session.add(progress)
    session.commit()
    session.refresh(progress)
    return progress
