# Quickstart: Quiz Question Validation Manual Test Scenarios

## Prerequisites

- Platform running: `podman-compose up -d`
- One admin account and one learner account exist
- One project exists with documents uploaded and quiz questions generated

---

## Scenario 1: Questions Default to Unpublished

1. Log in as admin → open any project → click the Quiz tab
2. Verify all questions show an "Unpublished" badge
3. Log in as learner → open the same project → click the Quiz tab
4. Verify learner sees "No questions available yet" (quiz is empty)

**Pass**: All generated questions are hidden from learners by default.

---

## Scenario 2: Publish Individual Questions

1. Log in as admin → project Quiz tab
2. Click "Publish" on one question → verify its badge changes to "Published"
3. Log in as learner → open the quiz → verify only that one question appears
4. Answer it and submit → verify score is calculated correctly

**Pass**: Only published questions appear to learners; scoring works on published set.

---

## Scenario 3: Publish All

1. Log in as admin → project Quiz tab with several unpublished questions
2. Click "Publish All" → verify all question badges change to "Published"
3. Log in as learner → open the quiz → verify all questions appear

**Pass**: Bulk publish works in a single click.

---

## Scenario 4: Unpublish a Question

1. Log in as admin → click "Unpublish" on a previously published question
2. Verify its badge reverts to "Unpublished"
3. Log in as learner → verify that question no longer appears in the quiz

**Pass**: Unpublish removes the question from learner view.

---

## Scenario 5: Edit a Question

1. Log in as admin → click "Edit" on any question
2. Change the question text, one option, and the correct answer → click Save
3. Verify the question card reflects the updated content
4. Log in as learner → take the quiz → verify the updated question text appears and scoring uses the new correct answer

**Pass**: Edits are saved immediately and reflected for learners.

---

## Scenario 6: Edit Validation

1. Log in as admin → click "Edit" on any question
2. Clear the question text → try to Save → verify a validation error appears and save is blocked
3. Restore question text → clear a correct answer radio selection → verify save is still blocked

**Pass**: Empty question text and no correct answer both block save.

---

## Scenario 7: Delete a Question

1. Log in as admin → click "Delete" on a question
2. Verify a confirmation prompt appears → click Cancel → verify the question still exists
3. Click "Delete" again → confirm → verify the question is removed from the list
4. Log in as learner → verify the deleted question does not appear

**Pass**: Delete requires confirmation; question is permanently removed.

---

## Scenario 8: Regeneration Warning

1. Log in as admin → publish at least one question
2. Click "Regenerate" on the Quiz tab
3. Verify a warning dialog appears: "This will replace all questions, including published ones"
4. Click Cancel → verify existing questions are unchanged
5. Click Regenerate again → confirm → verify all old questions (including the published one) are replaced with new unpublished questions

**Pass**: Warning shown when published questions exist; regeneration replaces all questions and resets to unpublished.
