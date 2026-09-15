-- Reset du lieu test chuoi UngVien (NguoiDungId=3) + tin test, GIU seed/tin mau Id=3.
-- Chay truoc moi lan Run full scenario E2E de tranh trung unique.
-- Su dung: Get-Content scripts/reset-test-data.sql | docker exec -i postgres psql -U postgres -d smart_recruitment_db
DELETE FROM "DanhGia" WHERE "DonUngTuyenId" IN (
  SELECT d."Id" FROM "DonUngTuyen" d
  JOIN "HoSoUngVien" h ON h."Id" = d."HoSoUngVienId" WHERE h."NguoiDungId" = 3);
DELETE FROM "KetQuaPhanTichCv" WHERE "CVUngVienId" IN (
  SELECT c."Id" FROM "CVUngVien" c
  JOIN "HoSoUngVien" h ON h."Id" = c."HoSoUngVienId" WHERE h."NguoiDungId" = 3);
DELETE FROM "KetQuaPhuHop" WHERE "HoSoUngVienId" IN (
  SELECT "Id" FROM "HoSoUngVien" WHERE "NguoiDungId" = 3);
DELETE FROM "KinhNghiemLamViec" WHERE "HoSoUngVienId" IN (
  SELECT "Id" FROM "HoSoUngVien" WHERE "NguoiDungId" = 3);
DELETE FROM "KyNangUngVien" WHERE "HoSoUngVienId" IN (
  SELECT "Id" FROM "HoSoUngVien" WHERE "NguoiDungId" = 3);
DELETE FROM "DonUngTuyen" WHERE "HoSoUngVienId" IN (
  SELECT "Id" FROM "HoSoUngVien" WHERE "NguoiDungId" = 3);
DELETE FROM "CVUngVien" WHERE "HoSoUngVienId" IN (
  SELECT "Id" FROM "HoSoUngVien" WHERE "NguoiDungId" = 3);
DELETE FROM "HoSoUngVien" WHERE "NguoiDungId" = 3;
DELETE FROM "TinTuyenDung" WHERE "Id" <> 3 AND "TieuDe" LIKE '%Test%';
