# Job owner (NguoiDangTinId) transfer smoke checks

Requires the Docker backend, PostgreSQL and the seeded employer accounts.
Set `JOB_OWNER_TRANSFER_SMOKE_PASSWORD` to their password, then run:

```powershell
node "tests/JobOwnerTransfer.Smoke/run.mjs"
```

Optional `JOB_OWNER_TRANSFER_SMOKE_BASE_URL` defaults to `http://127.0.0.1:8000/api`.

Creates two draft probe jobs owned by the representative of doanh nghiệp 5, then
drives the real endpoints: `POST /tintuyendungs/{id}/sang-nhuong` and
`POST /tintuyendungs/sang-nhuong-hang-loat`. It checks that ownership is the
object-level security key (the new owner can open `show/{id}` and sees the job in
the list, the previous and other same-company HR cannot), that a NHAN_SU actor is
refused even for a job they own, that a target from another doanh nghiệp is
refused for both single and bulk transfer, that self-transfer is 400, that
re-assigning to the current owner is a no-op, and that `DELETE /nhansus/{id}` is
blocked with the "giao tin trước" message while the member still owns jobs
without deleting the roster row.

Handover notifications are asserted to use `ReferenceType =
'SangNhuongNguoiDangTin'` only, because `GetAllTinTuyenDungsQuery` renders the
latest `'TinTuyenDung'` notification as `GhiChuKiemDuyet` in the UI.

Probe jobs are removed through the API and the probe notifications are
hard-deleted; the suite fails loudly unless `TinTuyenDung`, `Notifications`,
`HoSoNhaTuyenDung` and the out-of-scope ownership counts return to the values
snapshotted before the run.
