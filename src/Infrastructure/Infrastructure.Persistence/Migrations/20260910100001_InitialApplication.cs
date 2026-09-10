using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DanhMucNghe",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenNghe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MoTa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhMucNghe", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KyNang",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenKyNang = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MoTa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KyNang", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NguoiDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ApplicationUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    VaiTro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NguoiDung", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    NoiDung = table.Column<string>(type: "text", nullable: false),
                    LoaiThongBao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ReferenceId = table.Column<int>(type: "integer", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DoanhNghiep",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenDoanhNghiep = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MoTa = table.Column<string>(type: "text", nullable: true),
                    Website = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    DiaChi = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MaSoThue = table.Column<string>(type: "text", nullable: true),
                    LinhVucHoatDong = table.Column<string>(type: "text", nullable: true),
                    QuyMoNhanSu = table.Column<string>(type: "text", nullable: true),
                    NguoiDaiDienId = table.Column<int>(type: "integer", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoanhNghiep", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoanhNghiep_NguoiDung_NguoiDaiDienId",
                        column: x => x.NguoiDaiDienId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HoSoUngVien",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    HoTen = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SDT = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    NgaySinh = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GioiTinh = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    DiaChi = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    GioiThieu = table.Column<string>(type: "text", nullable: true),
                    ViTriUngTuyen = table.Column<string>(type: "text", nullable: true),
                    MucLuongMongMuon = table.Column<double>(type: "double precision", nullable: false),
                    IsTimViec = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoSoUngVien", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HoSoUngVien_NguoiDung_NguoiDungId",
                        column: x => x.NguoiDungId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificationRecipients",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "integer", nullable: false),
                    NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRecipients", x => new { x.NotificationId, x.NguoiDungId });
                    table.ForeignKey(
                        name: "FK_NotificationRecipients_NguoiDung_NguoiDungId",
                        column: x => x.NguoiDungId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationRecipients_Notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalTable: "Notifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HoSoNhaTuyenDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    DoanhNghiepId = table.Column<int>(type: "integer", nullable: false),
                    HoTen = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SDT = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ChucVu = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoSoNhaTuyenDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HoSoNhaTuyenDung_DoanhNghiep_DoanhNghiepId",
                        column: x => x.DoanhNghiepId,
                        principalTable: "DoanhNghiep",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HoSoNhaTuyenDung_NguoiDung_NguoiDungId",
                        column: x => x.NguoiDungId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoiMoiNhanSu",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoanhNghiepId = table.Column<int>(type: "integer", nullable: false),
                    NguoiDaiDienId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    HoTen = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ChucVu = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LoiMoi = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NgayHetHan = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoiMoiNhanSu", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoiMoiNhanSu_DoanhNghiep_DoanhNghiepId",
                        column: x => x.DoanhNghiepId,
                        principalTable: "DoanhNghiep",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LoiMoiNhanSu_NguoiDung_NguoiDaiDienId",
                        column: x => x.NguoiDaiDienId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TinTuyenDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoanhNghiepId = table.Column<int>(type: "integer", nullable: false),
                    DanhMucNgheId = table.Column<int>(type: "integer", nullable: false),
                    NguoiDangTinId = table.Column<int>(type: "integer", nullable: false),
                    TieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MoTaCongViec = table.Column<string>(type: "text", nullable: false),
                    KinhNghiemYeuCau = table.Column<string>(type: "text", nullable: true),
                    YeuCauCongViec = table.Column<string>(type: "text", nullable: false),
                    QuyenLoi = table.Column<string>(type: "text", nullable: true),
                    DiaDiemLamViec = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    LuongToiThieu = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    LuongToiDa = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    TrangThai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NgayHetHan = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TinTuyenDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TinTuyenDung_DanhMucNghe_DanhMucNgheId",
                        column: x => x.DanhMucNgheId,
                        principalTable: "DanhMucNghe",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TinTuyenDung_DoanhNghiep_DoanhNghiepId",
                        column: x => x.DoanhNghiepId,
                        principalTable: "DoanhNghiep",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TinTuyenDung_NguoiDung_NguoiDangTinId",
                        column: x => x.NguoiDangTinId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CVUngVien",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    TenFile = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    NgayUpload = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsDaXoa = table.Column<bool>(type: "boolean", nullable: false),
                    NoiDungJson = table.Column<string>(type: "jsonb", nullable: false),
                    TemplateId = table.Column<string>(type: "text", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CVUngVien", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CVUngVien_HoSoUngVien_HoSoUngVienId",
                        column: x => x.HoSoUngVienId,
                        principalTable: "HoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KetQuaPhuHop",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    TinTuyenDungId = table.Column<int>(type: "integer", nullable: false),
                    DiemPhuHop = table.Column<float>(type: "real", nullable: false),
                    KyNangThoa = table.Column<string>(type: "text", nullable: true),
                    KyNangThieu = table.Column<string>(type: "text", nullable: true),
                    PhanLoai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GhiChu = table.Column<string>(type: "text", nullable: true),
                    HoSoUngVienId1 = table.Column<int>(type: "integer", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KetQuaPhuHop", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KetQuaPhuHop_HoSoUngVien_HoSoUngVienId",
                        column: x => x.HoSoUngVienId,
                        principalTable: "HoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KetQuaPhuHop_HoSoUngVien_HoSoUngVienId1",
                        column: x => x.HoSoUngVienId1,
                        principalTable: "HoSoUngVien",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KetQuaPhuHop_TinTuyenDung_TinTuyenDungId",
                        column: x => x.TinTuyenDungId,
                        principalTable: "TinTuyenDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KyNangTinTuyenDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TinTuyenDungId = table.Column<int>(type: "integer", nullable: false),
                    KyNangId = table.Column<int>(type: "integer", nullable: false),
                    MucDoYeuCau = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KyNangTinTuyenDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KyNangTinTuyenDung_KyNang_KyNangId",
                        column: x => x.KyNangId,
                        principalTable: "KyNang",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KyNangTinTuyenDung_TinTuyenDung_TinTuyenDungId",
                        column: x => x.TinTuyenDungId,
                        principalTable: "TinTuyenDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DonUngTuyen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TinTuyenDungId = table.Column<int>(type: "integer", nullable: false),
                    CVUngVienId = table.Column<int>(type: "integer", nullable: false),
                    NguoiXuLyId = table.Column<int>(type: "integer", nullable: false),
                    GhiChu = table.Column<string>(type: "text", nullable: true),
                    TrangThai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NgayUngTuyen = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonUngTuyen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DonUngTuyen_CVUngVien_CVUngVienId",
                        column: x => x.CVUngVienId,
                        principalTable: "CVUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DonUngTuyen_TinTuyenDung_TinTuyenDungId",
                        column: x => x.TinTuyenDungId,
                        principalTable: "TinTuyenDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "KetQuaPhanTichCv",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CVUngVienId = table.Column<int>(type: "integer", nullable: false),
                    NoiDungTrichXuat = table.Column<string>(type: "text", nullable: true),
                    KyNangTrichXuat = table.Column<string>(type: "text", nullable: true),
                    KinhNghiemTrichXuat = table.Column<string>(type: "text", nullable: true),
                    HocVanTrichXuat = table.Column<string>(type: "text", nullable: true),
                    PhanTich = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KetQuaPhanTichCv", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KetQuaPhanTichCv_CVUngVien_CVUngVienId",
                        column: x => x.CVUngVienId,
                        principalTable: "CVUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DanhGia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DonUngTuyenId = table.Column<int>(type: "integer", nullable: false),
                    NoiDungPhanHoi = table.Column<string>(type: "text", nullable: true),
                    KetLuan = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    NgayPhanHoi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhGia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DanhGia_DonUngTuyen_DonUngTuyenId",
                        column: x => x.DonUngTuyenId,
                        principalTable: "DonUngTuyen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CVUngVien_HoSoUngVienId",
                table: "CVUngVien",
                column: "HoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia",
                column: "DonUngTuyenId");

            migrationBuilder.CreateIndex(
                name: "IX_DanhMucNghe_TenNghe",
                table: "DanhMucNghe",
                column: "TenNghe",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoanhNghiep_MaSoThue",
                table: "DoanhNghiep",
                column: "MaSoThue",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoanhNghiep_NguoiDaiDienId",
                table: "DoanhNghiep",
                column: "NguoiDaiDienId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_CVUngVienId",
                table: "DonUngTuyen",
                column: "CVUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId",
                table: "DonUngTuyen",
                column: "TinTuyenDungId");

            migrationBuilder.CreateIndex(
                name: "IX_HoSoNhaTuyenDung_DoanhNghiepId",
                table: "HoSoNhaTuyenDung",
                column: "DoanhNghiepId");

            migrationBuilder.CreateIndex(
                name: "IX_HoSoNhaTuyenDung_NguoiDungId",
                table: "HoSoNhaTuyenDung",
                column: "NguoiDungId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HoSoUngVien_NguoiDungId",
                table: "HoSoUngVien",
                column: "NguoiDungId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhanTichCv_CVUngVienId",
                table: "KetQuaPhanTichCv",
                column: "CVUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId",
                table: "KetQuaPhuHop",
                column: "HoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId1",
                table: "KetQuaPhuHop",
                column: "HoSoUngVienId1");

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_TinTuyenDungId",
                table: "KetQuaPhuHop",
                column: "TinTuyenDungId");

            migrationBuilder.CreateIndex(
                name: "IX_KyNang_TenKyNang",
                table: "KyNang",
                column: "TenKyNang",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KyNangTinTuyenDung_KyNangId",
                table: "KyNangTinTuyenDung",
                column: "KyNangId");

            migrationBuilder.CreateIndex(
                name: "IX_KyNangTinTuyenDung_TinTuyenDungId",
                table: "KyNangTinTuyenDung",
                column: "TinTuyenDungId");

            migrationBuilder.CreateIndex(
                name: "IX_LoiMoiNhanSu_DoanhNghiepId",
                table: "LoiMoiNhanSu",
                column: "DoanhNghiepId");

            migrationBuilder.CreateIndex(
                name: "IX_LoiMoiNhanSu_NguoiDaiDienId",
                table: "LoiMoiNhanSu",
                column: "NguoiDaiDienId");

            migrationBuilder.CreateIndex(
                name: "IX_LoiMoiNhanSu_Token",
                table: "LoiMoiNhanSu",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NguoiDung_ApplicationUserId",
                table: "NguoiDung",
                column: "ApplicationUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipients_NguoiDungId",
                table: "NotificationRecipients",
                column: "NguoiDungId");

            migrationBuilder.CreateIndex(
                name: "IX_TinTuyenDung_DanhMucNgheId",
                table: "TinTuyenDung",
                column: "DanhMucNgheId");

            migrationBuilder.CreateIndex(
                name: "IX_TinTuyenDung_DoanhNghiepId",
                table: "TinTuyenDung",
                column: "DoanhNghiepId");

            migrationBuilder.CreateIndex(
                name: "IX_TinTuyenDung_NguoiDangTinId",
                table: "TinTuyenDung",
                column: "NguoiDangTinId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DanhGia");

            migrationBuilder.DropTable(
                name: "HoSoNhaTuyenDung");

            migrationBuilder.DropTable(
                name: "KetQuaPhanTichCv");

            migrationBuilder.DropTable(
                name: "KetQuaPhuHop");

            migrationBuilder.DropTable(
                name: "KyNangTinTuyenDung");

            migrationBuilder.DropTable(
                name: "LoiMoiNhanSu");

            migrationBuilder.DropTable(
                name: "NotificationRecipients");

            migrationBuilder.DropTable(
                name: "DonUngTuyen");

            migrationBuilder.DropTable(
                name: "KyNang");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "CVUngVien");

            migrationBuilder.DropTable(
                name: "TinTuyenDung");

            migrationBuilder.DropTable(
                name: "HoSoUngVien");

            migrationBuilder.DropTable(
                name: "DanhMucNghe");

            migrationBuilder.DropTable(
                name: "DoanhNghiep");

            migrationBuilder.DropTable(
                name: "NguoiDung");
        }
    }
}
