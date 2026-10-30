/**
 * Xuất 7 Canva seeds (TS single source of truth) -> file C# seeder.
 *
 * Chạy từ src/WebApi/frontend:
 *   1. npx tsc -p tsconfig.seedexport.json   (biên dịch canva-seeds + deps ra /tmp/canvaseeds)
 *   2. node scripts/export-canva-seeds.cjs    (sinh DefaultCanvaThemeSeeds.cs)
 *
 * CauHinhJson nhúng nguyên văn (verbatim string @"...", quotes nhân đôi).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const COMPILED = "/tmp/canvaseeds/features/tao-cv/services/canva-seeds.js";
const OUT_CS = path.resolve(
  __dirname,
  "../../../Infrastructure/Infrastructure.Identity/Seeds/DefaultCanvaThemeSeeds.cs",
);

function cs(str) {
  return `@\"${String(str).replace(/\"/g, '\"\"')}\"`;
}

function main() {
  if (!fs.existsSync(COMPILED)) {
    console.error(`Thieu file bien dich: ${COMPILED}\nChay truoc: npx tsc -p tsconfig.seedexport.json`);
    process.exit(1);
  }
  const { CANVA_SEEDS } = require(COMPILED);
  if (!Array.isArray(CANVA_SEEDS) || CANVA_SEEDS.length !== 7) {
    console.error(`CANVA_SEEDS bat thuong: ${CANVA_SEEDS && CANVA_SEEDS.length}`);
    process.exit(1);
  }

  const rows = CANVA_SEEDS.map((t, i) => {
    const json = JSON.stringify(t);
    const soCot = t.structure === "single" ? 1 : 2;
    const order = 45 + i;
    return `                if (!appContext.CvThemes.Any(x => x.Slug == \"${t.slug}\"))
                {
                    yield return new CvTheme
                    {
                        Slug = \"${t.slug}\",
                        Ten = ${cs(t.name)},
                        MoTa = ${cs(t.description || "")},
                        DanhMuc = \"${t.category}\",
                        CapBac = \"${t.level}\",
                        Tags = \"Studio,Canva\",
                        PhongCachThietKe = \"studio\",
                        SoCot = ${soCot},
                        ThanThienATS = ${t.atsFriendly ? "true" : "false"},
                        MauSacChuDao = \"${t.colors.primary}\",
                        IsActive = true,
                        ThuTu = ${order},
                        CauHinhJson = ${cs(json)},
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = \"system\",
                    };
                }`;
  }).join("\n");

  const file = `using Application.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Seed 7 preset themes chuẩn Canva cho bảng Quản lý CV/mẫu CV.
    /// CauHinhJson sinh từ features/tao-cv/services/canva-seeds.ts
    /// (single source of truth) — KHÔNG sửa tay JSON dưới đây, sửa TS
    /// rồi chạy lại scripts/export-canva-seeds.cjs.
    /// Idempotent — chỉ thêm slug chưa tồn tại trong DB.
    /// </summary>
    public static class DefaultCanvaThemeSeeds
    {
        private static IEnumerable<CvTheme> PendingThemes(IApplicationDbContext appContext)
        {
${rows}
            yield break;
        }

        public static async Task SeedAsync(IApplicationDbContext appContext)
        {
            foreach (var theme in PendingThemes(appContext).ToList())
            {
                await appContext.CvThemes.AddAsync(theme);
            }
            await appContext.SaveChangesAsync();
        }
    }
}
`;
  fs.writeFileSync(OUT_CS, file);
  console.log(`Da sinh ${OUT_CS} (${CANVA_SEEDS.length} themes)`);
}

main();
