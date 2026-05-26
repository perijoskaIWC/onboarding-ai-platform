# Data Model: Quiz Question Validation

## Existing Entity: Question (Modified)

**Table**: `questions`

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `id` | UUID string | auto | Primary key |
| `project_id` | UUID string | — | FK → `projects.id`, indexed |
| `question_text` | string | — | The question body |
| `option_a` | string | — | Answer option A |
| `option_b` | string | — | Answer option B |
| `option_c` | string | — | Answer option C |
| `option_d` | string | — | Answer option D |
| `correct_answer` | string | — | "A" \| "B" \| "C" \| "D" |
| `explanation` | string | null | Optional explanation shown post-quiz |
| **`is_published`** | boolean | **false** | **NEW — controls learner visibility** |

### Change Summary

One new column: `is_published BOOLEAN NOT NULL DEFAULT false`.

All existing questions default to unpublished when the column is added. This is intentional — existing questions must be reviewed before learners see them.

### State Transitions

```
[AI generates question] → is_published = false (hidden from learners)
        ↓ admin clicks Publish
is_published = true (visible to learners)
        ↓ admin clicks Unpublish
is_published = false (hidden again)
        ↓ admin clicks Delete
[row removed from table]
```

### Regeneration Behaviour

When `POST /api/admin/projects/{project_id}/questions` is triggered:
- All existing questions for the project are deleted (regardless of `is_published`)
- New questions are inserted with `is_published = false`
- Admin must re-review and publish after every regeneration

## No New Entities

No new tables are required. The feature is a UI layer + API layer on top of the existing `questions` table.
