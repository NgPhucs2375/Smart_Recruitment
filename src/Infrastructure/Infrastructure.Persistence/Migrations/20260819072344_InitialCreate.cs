using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "danhGias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    donUngTuyenId = table.Column<int>(type: "integer", nullable: false),
                    noiDungPhanHoi = table.Column<string>(type: "text", nullable: true),
                    ketLuan = table.Column<string>(type: "text", nullable: true),
                    ngayPhanHoi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_danhGias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "danhMucNghe",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenNghe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    moTa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_danhMucNghe", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "doanhNghiep",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenDoanhNghiep = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    moTa = table.Column<string>(type: "text", nullable: true),
                    website = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    diaChi = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    logoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_doanhNghiep", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "kyNang",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenKyNang = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    moTa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kyNang", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "nguoiDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    matKhau = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    vaiTro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Is_Active = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nguoiDung", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tinTuyenDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    doanhNghiepId = table.Column<int>(type: "integer", nullable: false),
                    danhMucNgheId = table.Column<int>(type: "integer", nullable: false),
                    tieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    moTaCongViec = table.Column<string>(type: "text", nullable: false),
                    kinhNghiemYeuCau = table.Column<string>(type: "text", nullable: true),
                    yeuCauCongViec = table.Column<string>(type: "text", nullable: false),
                    quyenLoi = table.Column<string>(type: "text", nullable: true),
                    diaDiemLamViec = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    luongToiThieu = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    luongToiDa = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    trangThai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ngayHetHan = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tinTuyenDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tinTuyenDung_danhMucNghe_danhMucNgheId",
                        column: x => x.danhMucNgheId,
                        principalTable: "danhMucNghe",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tinTuyenDung_doanhNghiep_doanhNghiepId",
                        column: x => x.doanhNghiepId,
                        principalTable: "doanhNghiep",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "hoSoNhaTuyenDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    doanhNghiepId = table.Column<int>(type: "integer", nullable: false),
                    hoTen = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SDT = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    chucVu = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hoSoNhaTuyenDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_hoSoNhaTuyenDung_doanhNghiep_doanhNghiepId",
                        column: x => x.doanhNghiepId,
                        principalTable: "doanhNghiep",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_hoSoNhaTuyenDung_nguoiDung_nguoiDungId",
                        column: x => x.nguoiDungId,
                        principalTable: "nguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hoSoUngVien",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    hoTen = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SDT = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ngaySinh = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    gioiTinh = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    diaChi = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    gioiThieu = table.Column<string>(type: "text", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hoSoUngVien", x => x.Id);
                    table.ForeignKey(
                        name: "FK_hoSoUngVien_nguoiDung_nguoiDungId",
                        column: x => x.nguoiDungId,
                        principalTable: "nguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "thongBao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    tieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    noiDung = table.Column<string>(type: "text", nullable: false),
                    loaiThongBao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Is_Read = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_thongBao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_thongBao_nguoiDung_nguoiDungId",
                        column: x => x.nguoiDungId,
                        principalTable: "nguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "kyNangTinTuyenDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tinTuyenDungId = table.Column<int>(type: "integer", nullable: false),
                    kyNangId = table.Column<int>(type: "integer", nullable: false),
                    mucDoYeuCau = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kyNangTinTuyenDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_kyNangTinTuyenDung_kyNang_kyNangId",
                        column: x => x.kyNangId,
                        principalTable: "kyNang",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_kyNangTinTuyenDung_tinTuyenDung_tinTuyenDungId",
                        column: x => x.tinTuyenDungId,
                        principalTable: "tinTuyenDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cvUngVien",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    tenFile = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    fileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ngayUpload = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_Default = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cvUngVien", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cvUngVien_hoSoUngVien_hoSoUngVienId",
                        column: x => x.hoSoUngVienId,
                        principalTable: "hoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ketQuaPhuHop",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    tinTuyenDungId = table.Column<int>(type: "integer", nullable: false),
                    diemPhuHop = table.Column<float>(type: "real", nullable: false),
                    phanLoai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ngayDanhGia = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ketQuaPhuHop", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ketQuaPhuHop_hoSoUngVien_hoSoUngVienId",
                        column: x => x.hoSoUngVienId,
                        principalTable: "hoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ketQuaPhuHop_tinTuyenDung_tinTuyenDungId",
                        column: x => x.tinTuyenDungId,
                        principalTable: "tinTuyenDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "kinhNghiemLamViecs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    tenCongTy = table.Column<string>(type: "text", nullable: true),
                    diaChi = table.Column<string>(type: "text", nullable: true),
                    tuNgay = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    denNgay = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    moTa = table.Column<string>(type: "text", nullable: true),
                    IsHienTai = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kinhNghiemLamViecs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_kinhNghiemLamViecs_hoSoUngVien_hoSoUngVienId",
                        column: x => x.hoSoUngVienId,
                        principalTable: "hoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "kyNangUngVien",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    kyNangId = table.Column<int>(type: "integer", nullable: false),
                    soNamKinhNghiem = table.Column<float>(type: "real", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kyNangUngVien", x => x.Id);
                    table.ForeignKey(
                        name: "FK_kyNangUngVien_hoSoUngVien_hoSoUngVienId",
                        column: x => x.hoSoUngVienId,
                        principalTable: "hoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_kyNangUngVien_kyNang_kyNangId",
                        column: x => x.kyNangId,
                        principalTable: "kyNang",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "donUngTuyen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    tinTuyenDungId = table.Column<int>(type: "integer", nullable: false),
                    cvUngVienId = table.Column<int>(type: "integer", nullable: false),
                    trangThai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ngayUngTuyen = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_donUngTuyen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_donUngTuyen_cvUngVien_cvUngVienId",
                        column: x => x.cvUngVienId,
                        principalTable: "cvUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_donUngTuyen_hoSoUngVien_hoSoUngVienId",
                        column: x => x.hoSoUngVienId,
                        principalTable: "hoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_donUngTuyen_tinTuyenDung_tinTuyenDungId",
                        column: x => x.tinTuyenDungId,
                        principalTable: "tinTuyenDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ketQuaPhanTichCv",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    cvUngVienId = table.Column<int>(type: "integer", nullable: false),
                    noiDungTrichXuat = table.Column<string>(type: "text", nullable: true),
                    kyNangTrichXuat = table.Column<string>(type: "text", nullable: true),
                    kinhNghiemTrichXuat = table.Column<string>(type: "text", nullable: true),
                    ngayPhanTich = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ketQuaPhanTichCv", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ketQuaPhanTichCv_cvUngVien_cvUngVienId",
                        column: x => x.cvUngVienId,
                        principalTable: "cvUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lichPhongVan",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    donUngTuyenId = table.Column<int>(type: "integer", nullable: false),
                    diaDiem = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ghiChu = table.Column<string>(type: "text", nullable: true),
                    thoiGianPhongVan = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    trangThai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lichPhongVan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lichPhongVan_donUngTuyen_donUngTuyenId",
                        column: x => x.donUngTuyenId,
                        principalTable: "donUngTuyen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cvUngVien_hoSoUngVienId",
                table: "cvUngVien",
                column: "hoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_danhMucNghe_tenNghe",
                table: "danhMucNghe",
                column: "tenNghe",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_donUngTuyen_cvUngVienId",
                table: "donUngTuyen",
                column: "cvUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_donUngTuyen_hoSoUngVienId",
                table: "donUngTuyen",
                column: "hoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_donUngTuyen_tinTuyenDungId",
                table: "donUngTuyen",
                column: "tinTuyenDungId");

            migrationBuilder.CreateIndex(
                name: "IX_hoSoNhaTuyenDung_doanhNghiepId",
                table: "hoSoNhaTuyenDung",
                column: "doanhNghiepId");

            migrationBuilder.CreateIndex(
                name: "IX_hoSoNhaTuyenDung_nguoiDungId",
                table: "hoSoNhaTuyenDung",
                column: "nguoiDungId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_hoSoUngVien_nguoiDungId",
                table: "hoSoUngVien",
                column: "nguoiDungId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ketQuaPhanTichCv_cvUngVienId",
                table: "ketQuaPhanTichCv",
                column: "cvUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_ketQuaPhuHop_hoSoUngVienId",
                table: "ketQuaPhuHop",
                column: "hoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_ketQuaPhuHop_tinTuyenDungId",
                table: "ketQuaPhuHop",
                column: "tinTuyenDungId");

            migrationBuilder.CreateIndex(
                name: "IX_kinhNghiemLamViecs_hoSoUngVienId",
                table: "kinhNghiemLamViecs",
                column: "hoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_kyNang_tenKyNang",
                table: "kyNang",
                column: "tenKyNang",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_kyNangTinTuyenDung_kyNangId",
                table: "kyNangTinTuyenDung",
                column: "kyNangId");

            migrationBuilder.CreateIndex(
                name: "IX_kyNangTinTuyenDung_tinTuyenDungId",
                table: "kyNangTinTuyenDung",
                column: "tinTuyenDungId");

            migrationBuilder.CreateIndex(
                name: "IX_kyNangUngVien_hoSoUngVienId",
                table: "kyNangUngVien",
                column: "hoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_kyNangUngVien_kyNangId",
                table: "kyNangUngVien",
                column: "kyNangId");

            migrationBuilder.CreateIndex(
                name: "IX_lichPhongVan_donUngTuyenId",
                table: "lichPhongVan",
                column: "donUngTuyenId");

            migrationBuilder.CreateIndex(
                name: "IX_nguoiDung_Email",
                table: "nguoiDung",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_thongBao_nguoiDungId",
                table: "thongBao",
                column: "nguoiDungId");

            migrationBuilder.CreateIndex(
                name: "IX_tinTuyenDung_danhMucNgheId",
                table: "tinTuyenDung",
                column: "danhMucNgheId");

            migrationBuilder.CreateIndex(
                name: "IX_tinTuyenDung_doanhNghiepId",
                table: "tinTuyenDung",
                column: "doanhNghiepId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "danhGias");

            migrationBuilder.DropTable(
                name: "hoSoNhaTuyenDung");

            migrationBuilder.DropTable(
                name: "ketQuaPhanTichCv");

            migrationBuilder.DropTable(
                name: "ketQuaPhuHop");

            migrationBuilder.DropTable(
                name: "kinhNghiemLamViecs");

            migrationBuilder.DropTable(
                name: "kyNangTinTuyenDung");

            migrationBuilder.DropTable(
                name: "kyNangUngVien");

            migrationBuilder.DropTable(
                name: "lichPhongVan");

            migrationBuilder.DropTable(
                name: "thongBao");

            migrationBuilder.DropTable(
                name: "kyNang");

            migrationBuilder.DropTable(
                name: "donUngTuyen");

            migrationBuilder.DropTable(
                name: "cvUngVien");

            migrationBuilder.DropTable(
                name: "tinTuyenDung");

            migrationBuilder.DropTable(
                name: "hoSoUngVien");

            migrationBuilder.DropTable(
                name: "danhMucNghe");

            migrationBuilder.DropTable(
                name: "doanhNghiep");

            migrationBuilder.DropTable(
                name: "nguoiDung");
        }
    }
}
