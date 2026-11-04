# CV trash / restore smoke checks

Requires the Docker backend, PostgreSQL and the seeded candidate accounts.
Set `CV_TRASH_SMOKE_PASSWORD` to their password, then run:

```powershell
node "tests/CvTrashRestore.Smoke/run.mjs"
```

Optional `CV_TRASH_SMOKE_BASE_URL` defaults to `http://127.0.0.1:8000/api`.
Creates uniquely named probe CVs, then verifies the real endpoints: soft delete
feeds `GET /cvungviens/thung-rac`, restore returns the CV to the live list,
foreign and admin restore attempts are refused, and the default flag only moves
to a restored CV when no live CV holds it. The `default` flag is read straight
from the `CVUngVien` table so cached list responses cannot mask the behaviour.
Probe rows are hard-deleted afterwards and the account's original default CV is
put back.
