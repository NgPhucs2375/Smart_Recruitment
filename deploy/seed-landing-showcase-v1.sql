-- =============================================================================
-- Landing showcase seed v1
-- - Append-only and idempotent: never deletes or updates existing data.
-- - Uses existing seeded companies and candidate profiles.
-- - Adds 20 active jobs, showcase CVs, and application volume for demos.
--
-- Run:
--   docker cp deploy/seed-landing-showcase-v1.sql postgres:/tmp/seed-landing-showcase-v1.sql
--   docker exec postgres psql -U postgres -d smart_recruitment_db -f /tmp/seed-landing-showcase-v1.sql
-- =============================================================================

BEGIN;

-- 1) Twenty realistic active jobs distributed across existing demo companies.
WITH showcase_jobs(title, company_name, category_name, location, salary_min, salary_max, work_mode, sort_order) AS (
    VALUES
        ('Senior .NET Platform Engineer', 'Công ty TNHH Công nghệ Smart Recruitment', 'Backend Development', 'TP. Hồ Chí Minh', 32000000, 52000000, 'Hybrid', 1),
        ('React Native Mobile Engineer', 'Công ty TNHH Công nghệ Smart Recruitment', 'Frontend Development', 'TP. Hồ Chí Minh', 25000000, 42000000, 'Hybrid', 2),
        ('QA Automation Engineer', 'Công ty TNHH Công nghệ Smart Recruitment', 'QA / QC', 'TP. Hồ Chí Minh', 18000000, 30000000, 'Onsite', 3),
        ('Backend .NET Engineer', 'Công ty TNHH Phần mềm Sao Khuê', 'Backend Development', 'Hà Nội', 22000000, 38000000, 'Remote', 4),
        ('Frontend React Developer', 'Công ty TNHH Phần mềm Sao Khuê', 'Frontend Development', 'Hà Nội', 18000000, 32000000, 'Hybrid', 5),
        ('DevOps Engineer', 'Công ty TNHH Phần mềm Sao Khuê', 'DevOps / Cloud', 'Hà Nội', 28000000, 48000000, 'Hybrid', 6),
        ('Data Analyst', 'Công ty CP Dữ liệu Mekong', 'Data Science & Analytics', 'TP. Hồ Chí Minh', 16000000, 28000000, 'Onsite', 7),
        ('Machine Learning Engineer', 'Công ty CP Dữ liệu Mekong', 'Data Science & Analytics', 'TP. Hồ Chí Minh', 30000000, 55000000, 'Hybrid', 8),
        ('Product Data Engineer', 'Công ty CP Dữ liệu Mekong', 'Data Science & Analytics', 'Đà Nẵng', 24000000, 40000000, 'Remote', 9),
        ('Business Analyst', 'Công ty TNHH Thương mại An Phát', 'Business Analysis', 'TP. Hồ Chí Minh', 17000000, 29000000, 'Onsite', 10),
        ('Full-stack TypeScript Developer', 'Công ty TNHH Thương mại An Phát', 'Full-stack Development', 'TP. Hồ Chí Minh', 20000000, 36000000, 'Hybrid', 11),
        ('Automation Tester', 'Công ty TNHH Thương mại An Phát', 'QA / QC', 'Bình Dương', 15000000, 26000000, 'Onsite', 12),
        ('Flutter Mobile Developer', 'Công ty CP Logistics Sao Việt', 'Mobile Development', 'TP. Hồ Chí Minh', 20000000, 36000000, 'Remote', 13),
        ('Cloud Infrastructure Engineer', 'Công ty CP Logistics Sao Việt', 'DevOps / Cloud', 'TP. Hồ Chí Minh', 26000000, 46000000, 'Hybrid', 14),
        ('Technical Project Manager', 'Công ty CP Logistics Sao Việt', 'Product Management', 'TP. Hồ Chí Minh', 30000000, 50000000, 'Hybrid', 15),
        ('UI/UX Product Designer', 'Công ty TNHH Thiết kế Pixel House', 'UI/UX Design', 'Hà Nội', 18000000, 32000000, 'Hybrid', 16),
        ('Junior Graphic Designer', 'Công ty TNHH Thiết kế Pixel House', 'UI/UX Design', 'Hà Nội', 10000000, 18000000, 'Onsite', 17),
        ('Financial Data Specialist', 'Công ty CP Tài chính Thịnh Vượng', 'Data Science & Analytics', 'Hà Nội', 22000000, 38000000, 'Onsite', 18),
        ('Cybersecurity Analyst', 'Công ty CP Tài chính Thịnh Vượng', 'Security', 'Hà Nội', 25000000, 45000000, 'Hybrid', 19),
        ('People Operations Specialist', 'Công ty CP Giáo dục Tri Thức Việt', 'Human Resources', 'Hà Nội', 14000000, 24000000, 'Onsite', 20)
),
resolved AS (
    SELECT
        s.*,
        d."Id" AS company_id,
        d."NguoiDaiDienId" AS owner_id,
        COALESCE(
            (SELECT k."Id" FROM "DanhMucNghe" k WHERE k."TenNghe" = s.category_name LIMIT 1),
            (SELECT k."Id" FROM "DanhMucNghe" k ORDER BY k."Id" LIMIT 1)
        ) AS category_id
    FROM showcase_jobs s
    JOIN "DoanhNghiep" d ON d."TenDoanhNghiep" = s.company_name
)
INSERT INTO "TinTuyenDung"
    ("DoanhNghiepId", "DanhMucNgheId", "NguoiDangTinId", "TieuDe", "MoTaCongViec",
     "KinhNghiemYeuCau", "YeuCauCongViec", "QuyenLoi", "DiaDiemLamViec",
     "LuongToiThieu", "LuongToiDa", "TrangThai", "NgayHetHan", "PhuongThucLamViec",
     "KetQuaSangLoc", "NguoiDaiDienDaDuyet", "CreatedBy", "Created")
SELECT
    r.company_id,
    r.category_id,
    r.owner_id,
    '[SHOWCASE] ' || r.title,
    'Tham gia xây dựng sản phẩm thật, phối hợp với đội ngũ đa chức năng và tạo ra trải nghiệm tốt cho người dùng.',
    'Từ 1-3 năm kinh nghiệm ở vị trí tương đương; ưu tiên ứng viên có sản phẩm thực tế.',
    'Tư duy giải quyết vấn đề tốt, giao tiếp rõ ràng và chủ động trong công việc.',
    'Lương cạnh tranh, bảo hiểm đầy đủ, ngân sách học tập và môi trường làm việc linh hoạt.',
    r.location,
    r.salary_min,
    r.salary_max,
    'DangTuyen',
    now() + interval '60 days',
    r.work_mode,
    '',
    true,
    'showcase-seed-v1',
    now() - (r.sort_order - 1) * interval '3 hours'
FROM resolved r
WHERE r.category_id IS NOT NULL
  AND r.owner_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "TinTuyenDung" t
      WHERE t."DoanhNghiepId" = r.company_id
        AND t."TieuDe" = '[SHOWCASE] ' || r.title
  );

-- 2) Give every existing candidate a readable showcase CV if one is not present.
DO $$
DECLARE
    candidate RECORD;
    cv_id integer;
BEGIN
    FOR candidate IN
        SELECT h."Id" AS profile_id,
               h."HoTen" AS full_name,
               h."SDT" AS phone,
               h."DiaChi" AS address,
               COALESCE(h."ViTriUngTuyen", 'Software Engineer') AS target_role,
               u."Email" AS email
        FROM "HoSoUngVien" h
        JOIN "NguoiDung" nd ON nd."Id" = h."NguoiDungId"
        JOIN "Identity"."User" u ON u."Id" = nd."ApplicationUserId"
        WHERE nd."VaiTro" = 'UNG_VIEN'
        ORDER BY h."Id"
        LIMIT 20
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM "CVUngVien" c
            WHERE c."HoSoUngVienId" = candidate.profile_id
              AND c."CreatedBy" = 'showcase-seed-v1'
              AND c."IsDaXoa" = false
        ) THEN
            INSERT INTO "CVUngVien"
                ("HoSoUngVienId", "TenFile", "TemplateId", "PhuongThucTao", "IsDefault", "IsDaXoa", "FileSize", "Created", "CreatedBy")
            VALUES
                (candidate.profile_id, 'Showcase CV - ' || candidate.full_name, 'classic', 'ThuCongTemplate', false, false, 0, now(), 'showcase-seed-v1')
            RETURNING "Id" INTO cv_id;

            INSERT INTO "CVThongTinLienHe"
                ("CVUngVienId", "HoTen", "Email", "SDT", "DiaChi", "ViTriUngTuyen", "GioiThieuBanThan", "GitHub", "LinkedIn", "Created", "CreatedBy")
            VALUES
                (cv_id, candidate.full_name, candidate.email, candidate.phone, candidate.address, candidate.target_role,
                 'Ứng viên showcase có kinh nghiệm thực tế, tinh thần học hỏi và khả năng phối hợp tốt trong đội ngũ sản phẩm.',
                 'https://github.com/showcase-candidate', 'https://linkedin.com/in/showcase-candidate', now(), 'showcase-seed-v1');

            INSERT INTO "CVHocVan"
                ("CVUngVienId", "Truong", "ChuyenNganh", "TuThang", "TuNam", "DenThang", "DenNam", "IsHienTai", "MoTa", "ThuTu", "Created", "CreatedBy")
            VALUES
                (cv_id, 'Đại học Công nghệ TP. Hồ Chí Minh', 'Kỹ thuật phần mềm', 9, 2018, 6, 2022, false, 'Tốt nghiệp loại Khá; tập trung vào phát triển phần mềm và hệ thống dữ liệu.', 0, now(), 'showcase-seed-v1');

            INSERT INTO "CVKinhNghiemLamViec"
                ("CVUngVienId", "CongTy", "ChucDanh", "TuThang", "TuNam", "DenThang", "DenNam", "IsHienTai", "MoTa", "ThuTu", "Created", "CreatedBy")
            VALUES
                (cv_id, 'Showcase Digital Lab', candidate.target_role, 7, 2022, 12, 2025, false, 'Xây dựng tính năng sản phẩm, cải thiện chất lượng mã nguồn và phối hợp với nhóm sản phẩm.', 0, now(), 'showcase-seed-v1');

            INSERT INTO "CVDuAn"
                ("CVUngVienId", "TenDuAn", "VaiTro", "Link", "MoTa", "TuThang", "TuNam", "DenThang", "DenNam", "IsHienTai", "ThuTu", "Created", "CreatedBy")
            VALUES
                (cv_id, 'Recruitment Analytics Dashboard', 'Full-stack Developer', 'https://github.com/showcase-candidate/recruitment-dashboard', 'Dashboard phân tích pipeline tuyển dụng, tích hợp biểu đồ và phân quyền người dùng.', 1, 2025, 6, 2025, false, 0, now(), 'showcase-seed-v1');
        END IF;
    END LOOP;
END $$;

-- 3) Add applications so landing cards and recruiter inboxes have meaningful counts.
WITH jobs AS (
    SELECT t."Id" AS job_id, t."DoanhNghiepId" AS company_id, t."NguoiDangTinId" AS owner_id,
           row_number() OVER (ORDER BY t."Id") AS rn
    FROM "TinTuyenDung" t
    WHERE t."CreatedBy" = 'showcase-seed-v1'
), cvs AS (
    SELECT c."Id" AS cv_id, c."HoSoUngVienId" AS profile_id,
           row_number() OVER (ORDER BY c."Id") AS rn
    FROM "CVUngVien" c
    WHERE c."CreatedBy" = 'showcase-seed-v1' AND c."IsDaXoa" = false
), picks AS (
    SELECT j.job_id, j.company_id, j.owner_id, c.cv_id, c.profile_id,
           ((j.rn + c.rn) % 4) AS state_bucket
    FROM jobs j
    CROSS JOIN cvs c
    WHERE ((j.rn + c.rn) % 3) = 0
)
INSERT INTO "DonUngTuyen"
    ("TinTuyenDungId", "CVUngVienId", "NguoiXuLyId", "GhiChu", "TrangThai", "NgayUngTuyen",
     "CreatedBy", "Created", "HoSoUngVienId", "DoanhNghiepId", "CvSnapshotJson")
SELECT
    p.job_id,
    p.cv_id,
    p.owner_id,
    CASE p.state_bucket
        WHEN 1 THEN 'Hồ sơ đang được xem xét.'
        WHEN 2 THEN 'Hồ sơ phù hợp với yêu cầu vị trí.'
        ELSE ''
    END,
    CASE p.state_bucket
        WHEN 1 THEN 'DaXem'
        WHEN 2 THEN 'PhuHop'
        WHEN 3 THEN 'TuChoi'
        ELSE 'ChoXuLy'
    END,
    now() - ((p.cv_id % 12) + 1) * interval '1 day',
    'showcase-seed-v1',
    now() - ((p.cv_id % 12) + 1) * interval '1 day',
    p.profile_id,
    p.company_id,
    '{}'::jsonb
FROM picks p
ON CONFLICT ("TinTuyenDungId", "HoSoUngVienId") WHERE "HoSoUngVienId" IS NOT NULL DO NOTHING;

-- 4) Add skill chips so the real landing cards are visually useful too.
INSERT INTO "KyNang" ("TenKyNang", "MoTa", "Created", "CreatedBy")
SELECT skill_name, 'Kỹ năng showcase cho dữ liệu trình diễn.', now(), 'showcase-seed-v1'
FROM (VALUES
    ('C#'), ('ASP.NET Core'), ('React'), ('TypeScript'), ('React Native'), ('Flutter'),
    ('PostgreSQL'), ('SQL'), ('Docker'), ('Kubernetes'), ('Azure'), ('AWS'),
    ('Python'), ('Power BI'), ('TensorFlow'), ('Selenium'), ('Figma'), ('UI/UX'),
    ('Product Management'), ('Cybersecurity'), ('Node.js'), ('Java'), ('Dart'), ('REST API'), ('Excel')
) AS skills(skill_name)
WHERE NOT EXISTS (
    SELECT 1 FROM "KyNang" existing WHERE lower(existing."TenKyNang") = lower(skill_name)
);

WITH job_skills(title, skill_name) AS (
    VALUES
        ('Senior .NET Platform Engineer', 'C#'), ('Senior .NET Platform Engineer', 'ASP.NET Core'), ('Senior .NET Platform Engineer', 'PostgreSQL'),
        ('React Native Mobile Engineer', 'React Native'), ('React Native Mobile Engineer', 'TypeScript'), ('React Native Mobile Engineer', 'React'),
        ('QA Automation Engineer', 'Selenium'), ('QA Automation Engineer', 'SQL'), ('QA Automation Engineer', 'Docker'),
        ('Backend .NET Engineer', 'C#'), ('Backend .NET Engineer', 'ASP.NET Core'), ('Backend .NET Engineer', 'SQL'),
        ('Frontend React Developer', 'React'), ('Frontend React Developer', 'TypeScript'), ('Frontend React Developer', 'Node.js'),
        ('DevOps Engineer', 'Docker'), ('DevOps Engineer', 'Kubernetes'), ('DevOps Engineer', 'Azure'),
        ('Data Analyst', 'SQL'), ('Data Analyst', 'Power BI'), ('Data Analyst', 'Excel'),
        ('Machine Learning Engineer', 'Python'), ('Machine Learning Engineer', 'TensorFlow'), ('Machine Learning Engineer', 'SQL'),
        ('Product Data Engineer', 'Python'), ('Product Data Engineer', 'PostgreSQL'), ('Product Data Engineer', 'Docker'),
        ('Business Analyst', 'SQL'), ('Business Analyst', 'Excel'), ('Business Analyst', 'Product Management'),
        ('Full-stack TypeScript Developer', 'TypeScript'), ('Full-stack TypeScript Developer', 'React'), ('Full-stack TypeScript Developer', 'Node.js'),
        ('Automation Tester', 'Selenium'), ('Automation Tester', 'SQL'), ('Automation Tester', 'Java'),
        ('Flutter Mobile Developer', 'Flutter'), ('Flutter Mobile Developer', 'Dart'), ('Flutter Mobile Developer', 'REST API'),
        ('Cloud Infrastructure Engineer', 'Kubernetes'), ('Cloud Infrastructure Engineer', 'Docker'), ('Cloud Infrastructure Engineer', 'AWS'),
        ('Technical Project Manager', 'Product Management'), ('Technical Project Manager', 'SQL'), ('Technical Project Manager', 'Figma'),
        ('UI/UX Product Designer', 'Figma'), ('UI/UX Product Designer', 'UI/UX'), ('UI/UX Product Designer', 'Product Management'),
        ('Junior Graphic Designer', 'Figma'), ('Junior Graphic Designer', 'UI/UX'), ('Junior Graphic Designer', 'Excel'),
        ('Financial Data Specialist', 'SQL'), ('Financial Data Specialist', 'Power BI'), ('Financial Data Specialist', 'Excel'),
        ('Cybersecurity Analyst', 'Cybersecurity'), ('Cybersecurity Analyst', 'Python'), ('Cybersecurity Analyst', 'SQL'),
        ('People Operations Specialist', 'Excel'), ('People Operations Specialist', 'SQL'), ('People Operations Specialist', 'Product Management')
)
INSERT INTO "KyNangTinTuyenDung"
    ("TinTuyenDungId", "KyNangId", "MucDoYeuCau", "Created", "CreatedBy")
SELECT t."Id", k."Id", 2, now(), 'showcase-seed-v1'
FROM job_skills js
JOIN "TinTuyenDung" t ON t."TieuDe" = '[SHOWCASE] ' || js.title
JOIN "KyNang" k ON lower(k."TenKyNang") = lower(js.skill_name)
WHERE NOT EXISTS (
    SELECT 1 FROM "KyNangTinTuyenDung" existing
    WHERE existing."TinTuyenDungId" = t."Id" AND existing."KyNangId" = k."Id"
);

-- 5) Summary for quick verification.
SELECT 'showcase jobs' AS metric, count(*)::text AS value
FROM "TinTuyenDung" WHERE "CreatedBy" = 'showcase-seed-v1'
UNION ALL
SELECT 'showcase cvs', count(*)::text
FROM "CVUngVien" WHERE "CreatedBy" = 'showcase-seed-v1'
UNION ALL
SELECT 'showcase applications', count(*)::text
FROM "DonUngTuyen" WHERE "CreatedBy" = 'showcase-seed-v1';

COMMIT;
