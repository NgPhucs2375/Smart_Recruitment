BEGIN;
CREATE TEMP TABLE gt_restore AS SELECT * FROM "KetQuaPhuHop" WHERE false;
COPY gt_restore FROM '/tmp/gt-snapshot.csv' CSV HEADER;
DELETE FROM "KetQuaPhuHop" WHERE "CVUngVienId" IN (SELECT "Id" FROM "CVUngVien" WHERE "TenFile" LIKE 'ground-truth-%');
INSERT INTO "KetQuaPhuHop" SELECT * FROM gt_restore;
COMMIT;