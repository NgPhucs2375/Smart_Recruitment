-- =============================================================================
-- Demo seed: phủ đủ trạng thái cho TinTuyenDung + DonUngTuyen
-- - Dùng lại dữ liệu có sẵn: DoanhNghiep, NguoiDung, HoSoUngVien.
-- - Mỗi trạng thái có số lượng ngẫu nhiên (tin: 1-3, đơn: 5-8 lần thử/trạng thái).
-- - Idempotent: mọi bản ghi demo được đánh dấu CreatedBy = 'demo-seed' và
--   được xoá/re-tạo mỗi lần chạy lại.
-- Chạy trong container postgres:
--   docker cp deploy/seed-demo-cases.sql postgres:/tmp/seed-demo-cases.sql
--   docker exec postgres psql -U postgres -d smart_recruitment_db -f /tmp/seed-demo-cases.sql
-- =============================================================================

BEGIN;

-- 1) Dọn dữ liệu demo của lần chạy trước (đơn trước, tin sau vì FK Restrict)
DELETE FROM "DonUngTuyen"
WHERE "CreatedBy" = 'demo-seed'
   OR "TinTuyenDungId" IN (SELECT "Id" FROM "TinTuyenDung" WHERE "CreatedBy" = 'demo-seed');

DELETE FROM "TinTuyenDung" WHERE "CreatedBy" = 'demo-seed';

-- 2) Bảo đảm mỗi hồ sơ ứng viên có 1 CV mặc định (DonUngTuyen.CVUngVienId là NOT NULL)
INSERT INTO "CVUngVien"
    ("HoSoUngVienId", "TenFile", "PhuongThucTao", "IsDefault", "IsDaXoa", "FileSize", "Created", "CreatedBy")
SELECT h."Id", 'CV-DEMO-' || h."Id", 'ThuCongTemplate', true, false, 0, now(), 'demo-seed'
FROM "HoSoUngVien" h
WHERE NOT EXISTS (
    SELECT 1 FROM "CVUngVien" c
    WHERE c."HoSoUngVienId" = h."Id" AND c."IsDaXoa" = false AND c."IsDefault" = true
);

INSERT INTO "CVThongTinLienHe"
    ("CVUngVienId", "HoTen", "ViTriUngTuyen", "MucLuongMongMuon", "Created", "CreatedBy")
SELECT c."Id", h."HoTen", h."ViTriUngTuyen", h."MucLuongMongMuon"::numeric(18,6), now(), 'demo-seed'
FROM "CVUngVien" c
JOIN "HoSoUngVien" h ON h."Id" = c."HoSoUngVienId"
WHERE c."CreatedBy" = 'demo-seed'
  AND NOT EXISTS (SELECT 1 FROM "CVThongTinLienHe" t WHERE t."CVUngVienId" = c."Id");

-- 3) Tin tuyển dụng: mỗi trạng thái 1-3 tin, rải ngẫu nhiên trên các doanh nghiệp có sẵn
WITH statuses(status) AS (
    VALUES
        ('Nhap'), ('ChoDuyetHeThong'), ('ChoAdminDuyet'), ('DangTuyen'), ('TamDung'),
        ('HetHan'), ('DaDong'), ('TuChoi'), ('BiKhoa'), ('ChoNguoiDaiDienDuyet')
),
gen AS (
    SELECT s.status, g.n
    FROM statuses s
    -- Tham chiếu s.status để Postgres đánh giá random() lại cho từng trạng thái.
    CROSS JOIN LATERAL generate_series(
        1, (1 + floor(random() * 3))::int + length(s.status) * 0
    ) AS g(n)
)
INSERT INTO "TinTuyenDung"
    ("DoanhNghiepId", "DanhMucNgheId", "NguoiDangTinId", "TieuDe", "MoTaCongViec",
     "KinhNghiemYeuCau", "YeuCauCongViec", "QuyenLoi", "DiaDiemLamViec",
     "LuongToiThieu", "LuongToiDa", "TrangThai", "NgayHetHan",
     "PhuongThucLamViec", "KetQuaSangLoc", "NguoiDaiDienDaDuyet", "CreatedBy", "Created")
SELECT
    c.company_id,
    cat.category_id,
    CASE
        WHEN g.status = 'ChoNguoiDaiDienDuyet'
            THEN COALESCE(hr.hr_user_id, c.rep_id)
        ELSE c.rep_id
    END,
    '[DEMO] ' || role.title || ' · ' || g.status || ' #' || g.n,
    'Mô tả mẫu cho trạng thái ' || g.status || '. Tham gia phát triển sản phẩm, phối hợp với các nhóm liên quan và báo cáo tiến độ định kỳ.',
    'Tối thiểu 1-3 năm kinh nghiệm ở vị trí tương đương.',
    'Có tinh thần trách nhiệm, giao tiếp tốt và làm việc nhóm.',
    'Lương thưởng cạnh tranh, bảo hiểm đầy đủ, môi trường chuyên nghiệp.',
    c.dia_chi,
    sal.min_salary,
    sal.min_salary + (5 + floor(random() * 30)::int) * 1000000,
    g.status,
    CASE
        -- Job sàng lọc đã quá hạn: TinTuyenDungSangLocJob bỏ qua (điều kiện NgayHetHan > now())
        -- nên trạng thái ChoDuyetHeThong được giữ lại ổn định cho demo.
        WHEN g.status = 'ChoDuyetHeThong' THEN now() - interval '1 day'
        WHEN g.status IN ('HetHan', 'DaDong') THEN now() - (30 + random() * 20) * interval '1 day'
        WHEN g.status IN ('DangTuyen', 'TamDung') THEN now() + (7 + random() * 30) * interval '1 day'
        ELSE now() + 30 * interval '1 day'
    END,
    (ARRAY['Onsite', 'Remote', 'Hybrid', 'Flexible'])[1 + floor(random() * 4)::int],
    CASE
        WHEN g.status IN ('TuChoi', 'BiKhoa', 'ChoAdminDuyet')
            THEN 'Bộ lọc phát hiện nội dung cần kiểm duyệt tay.'
        ELSE ''
    END,
    g.status NOT IN ('Nhap', 'ChoNguoiDaiDienDuyet'),
    'demo-seed',
    now() - (random() * 90) * interval '1 day'
FROM gen g
CROSS JOIN LATERAL (
    SELECT d."Id" AS company_id, d."NguoiDaiDienId" AS rep_id, d."DiaChi" AS dia_chi
    FROM "DoanhNghiep" d
    WHERE g.n > 0
    ORDER BY random() LIMIT 1
) c
CROSS JOIN LATERAL (
    SELECT k."Id" AS category_id
    FROM "DanhMucNghe" k
    WHERE g.n > 0
    ORDER BY random() LIMIT 1
) cat
LEFT JOIN LATERAL (
    SELECT h."NguoiDungId" AS hr_user_id
    FROM "HoSoNhaTuyenDung" h
    JOIN "NguoiDung" nd ON nd."Id" = h."NguoiDungId"
    WHERE h."DoanhNghiepId" = c.company_id AND nd."VaiTro" = 'NHAN_SU'
    ORDER BY random() LIMIT 1
) hr ON true
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'Frontend Developer', 'Backend Developer', 'Full-stack Developer', 'Data Analyst',
        'Data Engineer', 'QA Engineer', 'DevOps Engineer', 'UI/UX Designer',
        'Marketing Executive', 'Sales Executive', 'HR Specialist', 'Accountant'
    ])[1 + floor(random() * 12)::int] AS title
    WHERE g.n > 0
) role
CROSS JOIN LATERAL (
    SELECT (10000000 + floor(random() * 40)::int * 1000000) AS min_salary
    WHERE g.n > 0
) sal;

-- 4) Đơn ứng tuyển: mỗi trạng thái 5-8 lần thử, chọn ngẫu nhiên tin + ứng viên.
--    ON CONFLICT bỏ qua cặp (tin, hồ sơ) đã tồn tại (unique index).
WITH statuses(status) AS (
    VALUES
        ('KhoiTao'), ('LoiXuLyHoSo'), ('ChoXuLy'), ('DaXem'), ('UngVienRutDon'),
        ('PhuHop'), ('TuChoi'), ('QuaHanXuLy'), ('TinTuyenDungBiDong'), ('VoHieuHoa')
),
gen AS (
    SELECT s.status, g.n
    FROM statuses s
    CROSS JOIN LATERAL generate_series(
        1, (8 + floor(random() * 5))::int + length(s.status) * 0
    ) AS g(n)
),
picks AS (
    SELECT
        g.status,
        j."Id" AS job_id,
        j."DoanhNghiepId" AS company_id,
        cand.ho_so_id,
        cand.cv_id
    FROM gen g
    CROSS JOIN LATERAL (
        SELECT t."Id", t."DoanhNghiepId"
        FROM "TinTuyenDung" t
        WHERE t."CreatedBy" = 'demo-seed'
          AND (
                (g.status = 'TinTuyenDungBiDong' AND t."TrangThai" IN ('HetHan', 'DaDong'))
             OR (g.status <> 'TinTuyenDungBiDong' AND t."TrangThai" IN ('DangTuyen', 'TamDung'))
          )
        ORDER BY random() LIMIT 1
    ) j
    CROSS JOIN LATERAL (
        SELECT h."Id" AS ho_so_id, c."Id" AS cv_id
        FROM "HoSoUngVien" h
        JOIN "CVUngVien" c ON c."HoSoUngVienId" = h."Id" AND c."IsDaXoa" = false AND c."IsDefault" = true
        WHERE g.n > 0
        ORDER BY random() LIMIT 1
    ) cand
)
INSERT INTO "DonUngTuyen"
    ("TinTuyenDungId", "CVUngVienId", "NguoiXuLyId", "GhiChu", "TrangThai",
     "NgayUngTuyen", "CreatedBy", "Created", "HoSoUngVienId")
SELECT
    p.job_id,
    p.cv_id,
    COALESCE((SELECT d."NguoiDaiDienId" FROM "DoanhNghiep" d WHERE d."Id" = p.company_id), 1),
    CASE p.status
        WHEN 'PhuHop' THEN 'Hồ sơ đáp ứng yêu cầu, chuyển bước liên hệ.'
        WHEN 'TuChoi' THEN 'Chưa phù hợp với yêu cầu tuyển dụng.'
        WHEN 'UngVienRutDon' THEN 'Ứng viên chủ động rút đơn.'
        WHEN 'VoHieuHoa' THEN 'Tài khoản bị vô hiệu hoá do vi phạm.'
        ELSE NULL
    END,
    p.status,
    now() - (random() * 30) * interval '1 day',
    'demo-seed',
    now() - (random() * 30) * interval '1 day',
    p.ho_so_id
FROM picks p
ON CONFLICT ("TinTuyenDungId", "HoSoUngVienId") WHERE "HoSoUngVienId" IS NOT NULL DO NOTHING;

-- 5) Tóm tắt kết quả
SELECT 'TinTuyenDung' AS bang, "TrangThai", count(*) AS so_luong
FROM "TinTuyenDung" WHERE "CreatedBy" = 'demo-seed'
GROUP BY "TrangThai" ORDER BY "TrangThai";

SELECT 'DonUngTuyen' AS bang, "TrangThai", count(*) AS so_luong
FROM "DonUngTuyen" WHERE "CreatedBy" = 'demo-seed'
GROUP BY "TrangThai" ORDER BY "TrangThai";

COMMIT;
