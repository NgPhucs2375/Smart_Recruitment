-- Idempotent CV fixture for the Mobile candidate account.
-- Run after the backend has created the seed accounts and applied migrations:
--   docker cp deploy/seed-mobile-basicuser-cv.sql postgres:/tmp/seed-mobile-basicuser-cv.sql
--   docker exec postgres psql -U postgres -d smart_recruitment_db -f /tmp/seed-mobile-basicuser-cv.sql
-- This script only inserts missing rows. It does not delete or update existing data.

BEGIN;

DO $$
DECLARE
    application_user_id text;
    nguoi_dung_id integer;
    ho_so_id integer;
    cv_id integer;
BEGIN
    SELECT "Id"
    INTO application_user_id
    FROM "Identity"."User"
    WHERE lower("Email") = 'basicuser@gmail.com'
    LIMIT 1;

    IF application_user_id IS NULL THEN
        RAISE EXCEPTION 'Seed account basicuser@gmail.com was not found';
    END IF;

    SELECT "Id"
    INTO nguoi_dung_id
    FROM "NguoiDung"
    WHERE "ApplicationUserId" = application_user_id
    LIMIT 1;

    IF nguoi_dung_id IS NULL THEN
        RAISE EXCEPTION 'NguoiDung profile for basicuser@gmail.com was not found';
    END IF;

    SELECT "Id"
    INTO ho_so_id
    FROM "HoSoUngVien"
    WHERE "NguoiDungId" = nguoi_dung_id
    LIMIT 1;

    IF ho_so_id IS NULL THEN
        INSERT INTO "HoSoUngVien"
            ("NguoiDungId", "HoTen", "SDT", "DiaChi", "GioiThieu",
             "ViTriUngTuyen", "MucLuongMongMuon", "IsTimViec", "Created", "CreatedBy")
        VALUES
            (nguoi_dung_id, 'Nguyen Van A', '0901234567', 'Ho Chi Minh City',
             'Ung vien mau de kiem tra luong du lieu tren Mobile.',
             'Frontend Developer', 18000000, true, now(), 'mobile-test-seed')
        RETURNING "Id" INTO ho_so_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "CVUngVien"
        WHERE "HoSoUngVienId" = ho_so_id
          AND "CreatedBy" = 'mobile-test-seed'
          AND "IsDaXoa" = false
    ) THEN
        INSERT INTO "CVUngVien"
            ("HoSoUngVienId", "TenFile", "FileUrl", "TemplateId", "PhuongThucTao",
             "IsDefault", "IsDaXoa", "FileSize", "Created", "CreatedBy")
        VALUES
            (ho_so_id, 'CV Test Mobile - Nguyen Van A', NULL, 'classic', 'ThuCongTemplate',
             true, false, 0, now(), 'mobile-test-seed')
        RETURNING "Id" INTO cv_id;

        INSERT INTO "CVThongTinLienHe"
            ("CVUngVienId", "HoTen", "Email", "SDT", "DiaChi", "ViTriUngTuyen",
             "GioiThieuBanThan", "Created", "CreatedBy")
        VALUES
            (cv_id, 'Nguyen Van A', 'basicuser@gmail.com', '0901234567',
             'Ho Chi Minh City', 'Frontend Developer',
             'Ung vien mau de kiem tra danh sach va chi tiet CV tren Mobile.',
             now(), 'mobile-test-seed');
    END IF;
END $$;

COMMIT;
