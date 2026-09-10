using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChangeNameEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cvUngVien_hoSoUngVien_hoSoUngVienId",
                table: "cvUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_donUngTuyen_cvUngVien_cvUngVienId",
                table: "donUngTuyen");

            migrationBuilder.DropForeignKey(
                name: "FK_donUngTuyen_hoSoUngVien_hoSoUngVienId",
                table: "donUngTuyen");

            migrationBuilder.DropForeignKey(
                name: "FK_donUngTuyen_tinTuyenDung_tinTuyenDungId",
                table: "donUngTuyen");

            migrationBuilder.DropForeignKey(
                name: "FK_hoSoNhaTuyenDung_doanhNghiep_doanhNghiepId",
                table: "hoSoNhaTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_hoSoNhaTuyenDung_nguoiDung_nguoiDungId",
                table: "hoSoNhaTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_hoSoUngVien_nguoiDung_nguoiDungId",
                table: "hoSoUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_ketQuaPhanTichCv_cvUngVien_cvUngVienId",
                table: "ketQuaPhanTichCv");

            migrationBuilder.DropForeignKey(
                name: "FK_ketQuaPhuHop_hoSoUngVien_hoSoUngVienId",
                table: "ketQuaPhuHop");

            migrationBuilder.DropForeignKey(
                name: "FK_ketQuaPhuHop_tinTuyenDung_tinTuyenDungId",
                table: "ketQuaPhuHop");

            migrationBuilder.DropForeignKey(
                name: "FK_kinhNghiemLamViecs_hoSoUngVien_hoSoUngVienId",
                table: "kinhNghiemLamViecs");

            migrationBuilder.DropForeignKey(
                name: "FK_kyNangTinTuyenDung_kyNang_kyNangId",
                table: "kyNangTinTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_kyNangTinTuyenDung_tinTuyenDung_tinTuyenDungId",
                table: "kyNangTinTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_kyNangUngVien_hoSoUngVien_hoSoUngVienId",
                table: "kyNangUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_kyNangUngVien_kyNang_kyNangId",
                table: "kyNangUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_lichPhongVan_donUngTuyen_donUngTuyenId",
                table: "lichPhongVan");

            migrationBuilder.DropForeignKey(
                name: "FK_thongBao_nguoiDung_nguoiDungId",
                table: "thongBao");

            migrationBuilder.DropForeignKey(
                name: "FK_tinTuyenDung_danhMucNghe_danhMucNgheId",
                table: "tinTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_tinTuyenDung_doanhNghiep_doanhNghiepId",
                table: "tinTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tinTuyenDung",
                table: "tinTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_thongBao",
                table: "thongBao");

            migrationBuilder.DropPrimaryKey(
                name: "PK_nguoiDung",
                table: "nguoiDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_lichPhongVan",
                table: "lichPhongVan");

            migrationBuilder.DropPrimaryKey(
                name: "PK_kyNangUngVien",
                table: "kyNangUngVien");

            migrationBuilder.DropPrimaryKey(
                name: "PK_kyNangTinTuyenDung",
                table: "kyNangTinTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_kyNang",
                table: "kyNang");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ketQuaPhuHop",
                table: "ketQuaPhuHop");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ketQuaPhanTichCv",
                table: "ketQuaPhanTichCv");

            migrationBuilder.DropPrimaryKey(
                name: "PK_hoSoUngVien",
                table: "hoSoUngVien");

            migrationBuilder.DropPrimaryKey(
                name: "PK_hoSoNhaTuyenDung",
                table: "hoSoNhaTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_donUngTuyen",
                table: "donUngTuyen");

            migrationBuilder.DropPrimaryKey(
                name: "PK_doanhNghiep",
                table: "doanhNghiep");

            migrationBuilder.DropPrimaryKey(
                name: "PK_danhMucNghe",
                table: "danhMucNghe");

            migrationBuilder.DropPrimaryKey(
                name: "PK_cvUngVien",
                table: "cvUngVien");

            migrationBuilder.DropPrimaryKey(
                name: "PK_kinhNghiemLamViecs",
                table: "kinhNghiemLamViecs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_danhGias",
                table: "danhGias");

            migrationBuilder.RenameTable(
                name: "tinTuyenDung",
                newName: "TinTuyenDung");

            migrationBuilder.RenameTable(
                name: "thongBao",
                newName: "ThongBao");

            migrationBuilder.RenameTable(
                name: "nguoiDung",
                newName: "NguoiDung");

            migrationBuilder.RenameTable(
                name: "lichPhongVan",
                newName: "LichPhongVan");

            migrationBuilder.RenameTable(
                name: "kyNangUngVien",
                newName: "KyNangUngVien");

            migrationBuilder.RenameTable(
                name: "kyNangTinTuyenDung",
                newName: "KyNangTinTuyenDung");

            migrationBuilder.RenameTable(
                name: "kyNang",
                newName: "KyNang");

            migrationBuilder.RenameTable(
                name: "ketQuaPhuHop",
                newName: "KetQuaPhuHop");

            migrationBuilder.RenameTable(
                name: "ketQuaPhanTichCv",
                newName: "KetQuaPhanTichCv");

            migrationBuilder.RenameTable(
                name: "hoSoUngVien",
                newName: "HoSoUngVien");

            migrationBuilder.RenameTable(
                name: "hoSoNhaTuyenDung",
                newName: "HoSoNhaTuyenDung");

            migrationBuilder.RenameTable(
                name: "donUngTuyen",
                newName: "DonUngTuyen");

            migrationBuilder.RenameTable(
                name: "doanhNghiep",
                newName: "DoanhNghiep");

            migrationBuilder.RenameTable(
                name: "danhMucNghe",
                newName: "DanhMucNghe");

            migrationBuilder.RenameTable(
                name: "cvUngVien",
                newName: "CVUngVien");

            migrationBuilder.RenameTable(
                name: "kinhNghiemLamViecs",
                newName: "KinhNghiemLamViec");

            migrationBuilder.RenameTable(
                name: "danhGias",
                newName: "DanhGia");

            migrationBuilder.RenameColumn(
                name: "yeuCauCongViec",
                table: "TinTuyenDung",
                newName: "YeuCauCongViec");

            migrationBuilder.RenameColumn(
                name: "trangThai",
                table: "TinTuyenDung",
                newName: "TrangThai");

            migrationBuilder.RenameColumn(
                name: "tieuDe",
                table: "TinTuyenDung",
                newName: "TieuDe");

            migrationBuilder.RenameColumn(
                name: "quyenLoi",
                table: "TinTuyenDung",
                newName: "QuyenLoi");

            migrationBuilder.RenameColumn(
                name: "ngayHetHan",
                table: "TinTuyenDung",
                newName: "NgayHetHan");

            migrationBuilder.RenameColumn(
                name: "moTaCongViec",
                table: "TinTuyenDung",
                newName: "MoTaCongViec");

            migrationBuilder.RenameColumn(
                name: "luongToiThieu",
                table: "TinTuyenDung",
                newName: "LuongToiThieu");

            migrationBuilder.RenameColumn(
                name: "luongToiDa",
                table: "TinTuyenDung",
                newName: "LuongToiDa");

            migrationBuilder.RenameColumn(
                name: "kinhNghiemYeuCau",
                table: "TinTuyenDung",
                newName: "KinhNghiemYeuCau");

            migrationBuilder.RenameColumn(
                name: "doanhNghiepId",
                table: "TinTuyenDung",
                newName: "DoanhNghiepId");

            migrationBuilder.RenameColumn(
                name: "diaDiemLamViec",
                table: "TinTuyenDung",
                newName: "DiaDiemLamViec");

            migrationBuilder.RenameColumn(
                name: "danhMucNgheId",
                table: "TinTuyenDung",
                newName: "DanhMucNgheId");

            migrationBuilder.RenameIndex(
                name: "IX_tinTuyenDung_doanhNghiepId",
                table: "TinTuyenDung",
                newName: "IX_TinTuyenDung_DoanhNghiepId");

            migrationBuilder.RenameIndex(
                name: "IX_tinTuyenDung_danhMucNgheId",
                table: "TinTuyenDung",
                newName: "IX_TinTuyenDung_DanhMucNgheId");

            migrationBuilder.RenameColumn(
                name: "tieuDe",
                table: "ThongBao",
                newName: "TieuDe");

            migrationBuilder.RenameColumn(
                name: "noiDung",
                table: "ThongBao",
                newName: "NoiDung");

            migrationBuilder.RenameColumn(
                name: "nguoiDungId",
                table: "ThongBao",
                newName: "NguoiDungId");

            migrationBuilder.RenameColumn(
                name: "loaiThongBao",
                table: "ThongBao",
                newName: "LoaiThongBao");

            migrationBuilder.RenameColumn(
                name: "Is_Read",
                table: "ThongBao",
                newName: "IsRead");

            migrationBuilder.RenameIndex(
                name: "IX_thongBao_nguoiDungId",
                table: "ThongBao",
                newName: "IX_ThongBao_NguoiDungId");

            migrationBuilder.RenameColumn(
                name: "vaiTro",
                table: "NguoiDung",
                newName: "VaiTro");

            migrationBuilder.RenameColumn(
                name: "Is_Active",
                table: "NguoiDung",
                newName: "IsActive");

            migrationBuilder.RenameIndex(
                name: "IX_nguoiDung_ApplicationUserId",
                table: "NguoiDung",
                newName: "IX_NguoiDung_ApplicationUserId");

            migrationBuilder.RenameColumn(
                name: "trangThai",
                table: "LichPhongVan",
                newName: "TrangThai");

            migrationBuilder.RenameColumn(
                name: "thoiGianPhongVan",
                table: "LichPhongVan",
                newName: "ThoiGianPhongVan");

            migrationBuilder.RenameColumn(
                name: "ghiChu",
                table: "LichPhongVan",
                newName: "GhiChu");

            migrationBuilder.RenameColumn(
                name: "donUngTuyenId",
                table: "LichPhongVan",
                newName: "DonUngTuyenId");

            migrationBuilder.RenameColumn(
                name: "diaDiem",
                table: "LichPhongVan",
                newName: "DiaDiem");

            migrationBuilder.RenameIndex(
                name: "IX_lichPhongVan_donUngTuyenId",
                table: "LichPhongVan",
                newName: "IX_LichPhongVan_DonUngTuyenId");

            migrationBuilder.RenameColumn(
                name: "soNamKinhNghiem",
                table: "KyNangUngVien",
                newName: "SoNamKinhNghiem");

            migrationBuilder.RenameColumn(
                name: "kyNangId",
                table: "KyNangUngVien",
                newName: "KyNangId");

            migrationBuilder.RenameColumn(
                name: "hoSoUngVienId",
                table: "KyNangUngVien",
                newName: "HoSoUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_kyNangUngVien_kyNangId",
                table: "KyNangUngVien",
                newName: "IX_KyNangUngVien_KyNangId");

            migrationBuilder.RenameIndex(
                name: "IX_kyNangUngVien_hoSoUngVienId",
                table: "KyNangUngVien",
                newName: "IX_KyNangUngVien_HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "tinTuyenDungId",
                table: "KyNangTinTuyenDung",
                newName: "TinTuyenDungId");

            migrationBuilder.RenameColumn(
                name: "mucDoYeuCau",
                table: "KyNangTinTuyenDung",
                newName: "MucDoYeuCau");

            migrationBuilder.RenameColumn(
                name: "kyNangId",
                table: "KyNangTinTuyenDung",
                newName: "KyNangId");

            migrationBuilder.RenameIndex(
                name: "IX_kyNangTinTuyenDung_tinTuyenDungId",
                table: "KyNangTinTuyenDung",
                newName: "IX_KyNangTinTuyenDung_TinTuyenDungId");

            migrationBuilder.RenameIndex(
                name: "IX_kyNangTinTuyenDung_kyNangId",
                table: "KyNangTinTuyenDung",
                newName: "IX_KyNangTinTuyenDung_KyNangId");

            migrationBuilder.RenameColumn(
                name: "tenKyNang",
                table: "KyNang",
                newName: "TenKyNang");

            migrationBuilder.RenameColumn(
                name: "moTa",
                table: "KyNang",
                newName: "MoTa");

            migrationBuilder.RenameIndex(
                name: "IX_kyNang_tenKyNang",
                table: "KyNang",
                newName: "IX_KyNang_TenKyNang");

            migrationBuilder.RenameColumn(
                name: "tinTuyenDungId",
                table: "KetQuaPhuHop",
                newName: "TinTuyenDungId");

            migrationBuilder.RenameColumn(
                name: "phanLoai",
                table: "KetQuaPhuHop",
                newName: "PhanLoai");

            migrationBuilder.RenameColumn(
                name: "ngayDanhGia",
                table: "KetQuaPhuHop",
                newName: "NgayDanhGia");

            migrationBuilder.RenameColumn(
                name: "hoSoUngVienId",
                table: "KetQuaPhuHop",
                newName: "HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "diemPhuHop",
                table: "KetQuaPhuHop",
                newName: "DiemPhuHop");

            migrationBuilder.RenameIndex(
                name: "IX_ketQuaPhuHop_tinTuyenDungId",
                table: "KetQuaPhuHop",
                newName: "IX_KetQuaPhuHop_TinTuyenDungId");

            migrationBuilder.RenameIndex(
                name: "IX_ketQuaPhuHop_hoSoUngVienId",
                table: "KetQuaPhuHop",
                newName: "IX_KetQuaPhuHop_HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "noiDungTrichXuat",
                table: "KetQuaPhanTichCv",
                newName: "NoiDungTrichXuat");

            migrationBuilder.RenameColumn(
                name: "ngayPhanTich",
                table: "KetQuaPhanTichCv",
                newName: "NgayPhanTich");

            migrationBuilder.RenameColumn(
                name: "kyNangTrichXuat",
                table: "KetQuaPhanTichCv",
                newName: "KyNangTrichXuat");

            migrationBuilder.RenameColumn(
                name: "kinhNghiemTrichXuat",
                table: "KetQuaPhanTichCv",
                newName: "KinhNghiemTrichXuat");

            migrationBuilder.RenameColumn(
                name: "cvUngVienId",
                table: "KetQuaPhanTichCv",
                newName: "CVUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_ketQuaPhanTichCv_cvUngVienId",
                table: "KetQuaPhanTichCv",
                newName: "IX_KetQuaPhanTichCv_CVUngVienId");

            migrationBuilder.RenameColumn(
                name: "nguoiDungId",
                table: "HoSoUngVien",
                newName: "NguoiDungId");

            migrationBuilder.RenameColumn(
                name: "ngaySinh",
                table: "HoSoUngVien",
                newName: "NgaySinh");

            migrationBuilder.RenameColumn(
                name: "hoTen",
                table: "HoSoUngVien",
                newName: "HoTen");

            migrationBuilder.RenameColumn(
                name: "gioiTinh",
                table: "HoSoUngVien",
                newName: "GioiTinh");

            migrationBuilder.RenameColumn(
                name: "gioiThieu",
                table: "HoSoUngVien",
                newName: "GioiThieu");

            migrationBuilder.RenameColumn(
                name: "diaChi",
                table: "HoSoUngVien",
                newName: "DiaChi");

            migrationBuilder.RenameIndex(
                name: "IX_hoSoUngVien_nguoiDungId",
                table: "HoSoUngVien",
                newName: "IX_HoSoUngVien_NguoiDungId");

            migrationBuilder.RenameColumn(
                name: "nguoiDungId",
                table: "HoSoNhaTuyenDung",
                newName: "NguoiDungId");

            migrationBuilder.RenameColumn(
                name: "hoTen",
                table: "HoSoNhaTuyenDung",
                newName: "HoTen");

            migrationBuilder.RenameColumn(
                name: "doanhNghiepId",
                table: "HoSoNhaTuyenDung",
                newName: "DoanhNghiepId");

            migrationBuilder.RenameColumn(
                name: "chucVu",
                table: "HoSoNhaTuyenDung",
                newName: "ChucVu");

            migrationBuilder.RenameIndex(
                name: "IX_hoSoNhaTuyenDung_nguoiDungId",
                table: "HoSoNhaTuyenDung",
                newName: "IX_HoSoNhaTuyenDung_NguoiDungId");

            migrationBuilder.RenameIndex(
                name: "IX_hoSoNhaTuyenDung_doanhNghiepId",
                table: "HoSoNhaTuyenDung",
                newName: "IX_HoSoNhaTuyenDung_DoanhNghiepId");

            migrationBuilder.RenameColumn(
                name: "trangThai",
                table: "DonUngTuyen",
                newName: "TrangThai");

            migrationBuilder.RenameColumn(
                name: "tinTuyenDungId",
                table: "DonUngTuyen",
                newName: "TinTuyenDungId");

            migrationBuilder.RenameColumn(
                name: "ngayUngTuyen",
                table: "DonUngTuyen",
                newName: "NgayUngTuyen");

            migrationBuilder.RenameColumn(
                name: "hoSoUngVienId",
                table: "DonUngTuyen",
                newName: "HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "cvUngVienId",
                table: "DonUngTuyen",
                newName: "CVUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_donUngTuyen_tinTuyenDungId",
                table: "DonUngTuyen",
                newName: "IX_DonUngTuyen_TinTuyenDungId");

            migrationBuilder.RenameIndex(
                name: "IX_donUngTuyen_hoSoUngVienId",
                table: "DonUngTuyen",
                newName: "IX_DonUngTuyen_HoSoUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_donUngTuyen_cvUngVienId",
                table: "DonUngTuyen",
                newName: "IX_DonUngTuyen_CVUngVienId");

            migrationBuilder.RenameColumn(
                name: "website",
                table: "DoanhNghiep",
                newName: "Website");

            migrationBuilder.RenameColumn(
                name: "tenDoanhNghiep",
                table: "DoanhNghiep",
                newName: "TenDoanhNghiep");

            migrationBuilder.RenameColumn(
                name: "quyMoNhanSu",
                table: "DoanhNghiep",
                newName: "QuyMoNhanSu");

            migrationBuilder.RenameColumn(
                name: "nguoiDaiDien",
                table: "DoanhNghiep",
                newName: "NguoiDaiDien");

            migrationBuilder.RenameColumn(
                name: "moTa",
                table: "DoanhNghiep",
                newName: "MoTa");

            migrationBuilder.RenameColumn(
                name: "maSoThue",
                table: "DoanhNghiep",
                newName: "MaSoThue");

            migrationBuilder.RenameColumn(
                name: "logoUrl",
                table: "DoanhNghiep",
                newName: "LogoUrl");

            migrationBuilder.RenameColumn(
                name: "linhVucHoatDong",
                table: "DoanhNghiep",
                newName: "LinhVucHoatDong");

            migrationBuilder.RenameColumn(
                name: "diaChi",
                table: "DoanhNghiep",
                newName: "DiaChi");

            migrationBuilder.RenameColumn(
                name: "tenNghe",
                table: "DanhMucNghe",
                newName: "TenNghe");

            migrationBuilder.RenameColumn(
                name: "moTa",
                table: "DanhMucNghe",
                newName: "MoTa");

            migrationBuilder.RenameIndex(
                name: "IX_danhMucNghe_tenNghe",
                table: "DanhMucNghe",
                newName: "IX_DanhMucNghe_TenNghe");

            migrationBuilder.RenameColumn(
                name: "tenFile",
                table: "CVUngVien",
                newName: "TenFile");

            migrationBuilder.RenameColumn(
                name: "ngayUpload",
                table: "CVUngVien",
                newName: "NgayUpload");

            migrationBuilder.RenameColumn(
                name: "hoSoUngVienId",
                table: "CVUngVien",
                newName: "HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "fileUrl",
                table: "CVUngVien",
                newName: "FileUrl");

            migrationBuilder.RenameColumn(
                name: "is_Default",
                table: "CVUngVien",
                newName: "IsDefault");

            migrationBuilder.RenameIndex(
                name: "IX_cvUngVien_hoSoUngVienId",
                table: "CVUngVien",
                newName: "IX_CVUngVien_HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "tuNgay",
                table: "KinhNghiemLamViec",
                newName: "TuNgay");

            migrationBuilder.RenameColumn(
                name: "tenCongTy",
                table: "KinhNghiemLamViec",
                newName: "TenCongTy");

            migrationBuilder.RenameColumn(
                name: "moTa",
                table: "KinhNghiemLamViec",
                newName: "MoTa");

            migrationBuilder.RenameColumn(
                name: "hoSoUngVienId",
                table: "KinhNghiemLamViec",
                newName: "HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "diaChi",
                table: "KinhNghiemLamViec",
                newName: "DiaChi");

            migrationBuilder.RenameColumn(
                name: "denNgay",
                table: "KinhNghiemLamViec",
                newName: "DenNgay");

            migrationBuilder.RenameIndex(
                name: "IX_kinhNghiemLamViecs_hoSoUngVienId",
                table: "KinhNghiemLamViec",
                newName: "IX_KinhNghiemLamViec_HoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "noiDungPhanHoi",
                table: "DanhGia",
                newName: "NoiDungPhanHoi");

            migrationBuilder.RenameColumn(
                name: "ngayPhanHoi",
                table: "DanhGia",
                newName: "NgayPhanHoi");

            migrationBuilder.RenameColumn(
                name: "ketLuan",
                table: "DanhGia",
                newName: "KetLuan");

            migrationBuilder.RenameColumn(
                name: "donUngTuyenId",
                table: "DanhGia",
                newName: "DonUngTuyenId");

            migrationBuilder.AddColumn<int>(
                name: "HoSoUngVienId1",
                table: "KetQuaPhuHop",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TenCongTy",
                table: "KinhNghiemLamViec",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DiaChi",
                table: "KinhNghiemLamViec",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsHienTai",
                table: "KinhNghiemLamViec",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "KetLuan",
                table: "DanhGia",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TinTuyenDung",
                table: "TinTuyenDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ThongBao",
                table: "ThongBao",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_NguoiDung",
                table: "NguoiDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LichPhongVan",
                table: "LichPhongVan",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_KyNangUngVien",
                table: "KyNangUngVien",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_KyNangTinTuyenDung",
                table: "KyNangTinTuyenDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_KyNang",
                table: "KyNang",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_KetQuaPhuHop",
                table: "KetQuaPhuHop",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_KetQuaPhanTichCv",
                table: "KetQuaPhanTichCv",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HoSoUngVien",
                table: "HoSoUngVien",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HoSoNhaTuyenDung",
                table: "HoSoNhaTuyenDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DonUngTuyen",
                table: "DonUngTuyen",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DoanhNghiep",
                table: "DoanhNghiep",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DanhMucNghe",
                table: "DanhMucNghe",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CVUngVien",
                table: "CVUngVien",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_KinhNghiemLamViec",
                table: "KinhNghiemLamViec",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DanhGia",
                table: "DanhGia",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId1",
                table: "KetQuaPhuHop",
                column: "HoSoUngVienId1");

            migrationBuilder.CreateIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia",
                column: "DonUngTuyenId");

            migrationBuilder.AddForeignKey(
                name: "FK_CVUngVien_HoSoUngVien_HoSoUngVienId",
                table: "CVUngVien",
                column: "HoSoUngVienId",
                principalTable: "HoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DanhGia_DonUngTuyen_DonUngTuyenId",
                table: "DanhGia",
                column: "DonUngTuyenId",
                principalTable: "DonUngTuyen",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DonUngTuyen_CVUngVien_CVUngVienId",
                table: "DonUngTuyen",
                column: "CVUngVienId",
                principalTable: "CVUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DonUngTuyen_HoSoUngVien_HoSoUngVienId",
                table: "DonUngTuyen",
                column: "HoSoUngVienId",
                principalTable: "HoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DonUngTuyen_TinTuyenDung_TinTuyenDungId",
                table: "DonUngTuyen",
                column: "TinTuyenDungId",
                principalTable: "TinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_HoSoNhaTuyenDung_DoanhNghiep_DoanhNghiepId",
                table: "HoSoNhaTuyenDung",
                column: "DoanhNghiepId",
                principalTable: "DoanhNghiep",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_HoSoNhaTuyenDung_NguoiDung_NguoiDungId",
                table: "HoSoNhaTuyenDung",
                column: "NguoiDungId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_HoSoUngVien_NguoiDung_NguoiDungId",
                table: "HoSoUngVien",
                column: "NguoiDungId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KetQuaPhanTichCv_CVUngVien_CVUngVienId",
                table: "KetQuaPhanTichCv",
                column: "CVUngVienId",
                principalTable: "CVUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KetQuaPhuHop_HoSoUngVien_HoSoUngVienId",
                table: "KetQuaPhuHop",
                column: "HoSoUngVienId",
                principalTable: "HoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KetQuaPhuHop_HoSoUngVien_HoSoUngVienId1",
                table: "KetQuaPhuHop",
                column: "HoSoUngVienId1",
                principalTable: "HoSoUngVien",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_KetQuaPhuHop_TinTuyenDung_TinTuyenDungId",
                table: "KetQuaPhuHop",
                column: "TinTuyenDungId",
                principalTable: "TinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KinhNghiemLamViec_HoSoUngVien_HoSoUngVienId",
                table: "KinhNghiemLamViec",
                column: "HoSoUngVienId",
                principalTable: "HoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KyNangTinTuyenDung_KyNang_KyNangId",
                table: "KyNangTinTuyenDung",
                column: "KyNangId",
                principalTable: "KyNang",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_KyNangTinTuyenDung_TinTuyenDung_TinTuyenDungId",
                table: "KyNangTinTuyenDung",
                column: "TinTuyenDungId",
                principalTable: "TinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KyNangUngVien_HoSoUngVien_HoSoUngVienId",
                table: "KyNangUngVien",
                column: "HoSoUngVienId",
                principalTable: "HoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KyNangUngVien_KyNang_KyNangId",
                table: "KyNangUngVien",
                column: "KyNangId",
                principalTable: "KyNang",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LichPhongVan_DonUngTuyen_DonUngTuyenId",
                table: "LichPhongVan",
                column: "DonUngTuyenId",
                principalTable: "DonUngTuyen",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ThongBao_NguoiDung_NguoiDungId",
                table: "ThongBao",
                column: "NguoiDungId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TinTuyenDung_DanhMucNghe_DanhMucNgheId",
                table: "TinTuyenDung",
                column: "DanhMucNgheId",
                principalTable: "DanhMucNghe",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TinTuyenDung_DoanhNghiep_DoanhNghiepId",
                table: "TinTuyenDung",
                column: "DoanhNghiepId",
                principalTable: "DoanhNghiep",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CVUngVien_HoSoUngVien_HoSoUngVienId",
                table: "CVUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_DanhGia_DonUngTuyen_DonUngTuyenId",
                table: "DanhGia");

            migrationBuilder.DropForeignKey(
                name: "FK_DonUngTuyen_CVUngVien_CVUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.DropForeignKey(
                name: "FK_DonUngTuyen_HoSoUngVien_HoSoUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.DropForeignKey(
                name: "FK_DonUngTuyen_TinTuyenDung_TinTuyenDungId",
                table: "DonUngTuyen");

            migrationBuilder.DropForeignKey(
                name: "FK_HoSoNhaTuyenDung_DoanhNghiep_DoanhNghiepId",
                table: "HoSoNhaTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_HoSoNhaTuyenDung_NguoiDung_NguoiDungId",
                table: "HoSoNhaTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_HoSoUngVien_NguoiDung_NguoiDungId",
                table: "HoSoUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_KetQuaPhanTichCv_CVUngVien_CVUngVienId",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropForeignKey(
                name: "FK_KetQuaPhuHop_HoSoUngVien_HoSoUngVienId",
                table: "KetQuaPhuHop");

            migrationBuilder.DropForeignKey(
                name: "FK_KetQuaPhuHop_HoSoUngVien_HoSoUngVienId1",
                table: "KetQuaPhuHop");

            migrationBuilder.DropForeignKey(
                name: "FK_KetQuaPhuHop_TinTuyenDung_TinTuyenDungId",
                table: "KetQuaPhuHop");

            migrationBuilder.DropForeignKey(
                name: "FK_KinhNghiemLamViec_HoSoUngVien_HoSoUngVienId",
                table: "KinhNghiemLamViec");

            migrationBuilder.DropForeignKey(
                name: "FK_KyNangTinTuyenDung_KyNang_KyNangId",
                table: "KyNangTinTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_KyNangTinTuyenDung_TinTuyenDung_TinTuyenDungId",
                table: "KyNangTinTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_KyNangUngVien_HoSoUngVien_HoSoUngVienId",
                table: "KyNangUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_KyNangUngVien_KyNang_KyNangId",
                table: "KyNangUngVien");

            migrationBuilder.DropForeignKey(
                name: "FK_LichPhongVan_DonUngTuyen_DonUngTuyenId",
                table: "LichPhongVan");

            migrationBuilder.DropForeignKey(
                name: "FK_ThongBao_NguoiDung_NguoiDungId",
                table: "ThongBao");

            migrationBuilder.DropForeignKey(
                name: "FK_TinTuyenDung_DanhMucNghe_DanhMucNgheId",
                table: "TinTuyenDung");

            migrationBuilder.DropForeignKey(
                name: "FK_TinTuyenDung_DoanhNghiep_DoanhNghiepId",
                table: "TinTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TinTuyenDung",
                table: "TinTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ThongBao",
                table: "ThongBao");

            migrationBuilder.DropPrimaryKey(
                name: "PK_NguoiDung",
                table: "NguoiDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LichPhongVan",
                table: "LichPhongVan");

            migrationBuilder.DropPrimaryKey(
                name: "PK_KyNangUngVien",
                table: "KyNangUngVien");

            migrationBuilder.DropPrimaryKey(
                name: "PK_KyNangTinTuyenDung",
                table: "KyNangTinTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_KyNang",
                table: "KyNang");

            migrationBuilder.DropPrimaryKey(
                name: "PK_KetQuaPhuHop",
                table: "KetQuaPhuHop");

            migrationBuilder.DropIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId1",
                table: "KetQuaPhuHop");

            migrationBuilder.DropPrimaryKey(
                name: "PK_KetQuaPhanTichCv",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropPrimaryKey(
                name: "PK_HoSoUngVien",
                table: "HoSoUngVien");

            migrationBuilder.DropPrimaryKey(
                name: "PK_HoSoNhaTuyenDung",
                table: "HoSoNhaTuyenDung");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DonUngTuyen",
                table: "DonUngTuyen");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DoanhNghiep",
                table: "DoanhNghiep");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DanhMucNghe",
                table: "DanhMucNghe");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CVUngVien",
                table: "CVUngVien");

            migrationBuilder.DropPrimaryKey(
                name: "PK_KinhNghiemLamViec",
                table: "KinhNghiemLamViec");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DanhGia",
                table: "DanhGia");

            migrationBuilder.DropIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia");

            migrationBuilder.DropColumn(
                name: "HoSoUngVienId1",
                table: "KetQuaPhuHop");

            migrationBuilder.RenameTable(
                name: "TinTuyenDung",
                newName: "tinTuyenDung");

            migrationBuilder.RenameTable(
                name: "ThongBao",
                newName: "thongBao");

            migrationBuilder.RenameTable(
                name: "NguoiDung",
                newName: "nguoiDung");

            migrationBuilder.RenameTable(
                name: "LichPhongVan",
                newName: "lichPhongVan");

            migrationBuilder.RenameTable(
                name: "KyNangUngVien",
                newName: "kyNangUngVien");

            migrationBuilder.RenameTable(
                name: "KyNangTinTuyenDung",
                newName: "kyNangTinTuyenDung");

            migrationBuilder.RenameTable(
                name: "KyNang",
                newName: "kyNang");

            migrationBuilder.RenameTable(
                name: "KetQuaPhuHop",
                newName: "ketQuaPhuHop");

            migrationBuilder.RenameTable(
                name: "KetQuaPhanTichCv",
                newName: "ketQuaPhanTichCv");

            migrationBuilder.RenameTable(
                name: "HoSoUngVien",
                newName: "hoSoUngVien");

            migrationBuilder.RenameTable(
                name: "HoSoNhaTuyenDung",
                newName: "hoSoNhaTuyenDung");

            migrationBuilder.RenameTable(
                name: "DonUngTuyen",
                newName: "donUngTuyen");

            migrationBuilder.RenameTable(
                name: "DoanhNghiep",
                newName: "doanhNghiep");

            migrationBuilder.RenameTable(
                name: "DanhMucNghe",
                newName: "danhMucNghe");

            migrationBuilder.RenameTable(
                name: "CVUngVien",
                newName: "cvUngVien");

            migrationBuilder.RenameTable(
                name: "KinhNghiemLamViec",
                newName: "kinhNghiemLamViecs");

            migrationBuilder.RenameTable(
                name: "DanhGia",
                newName: "danhGias");

            migrationBuilder.RenameColumn(
                name: "YeuCauCongViec",
                table: "tinTuyenDung",
                newName: "yeuCauCongViec");

            migrationBuilder.RenameColumn(
                name: "TrangThai",
                table: "tinTuyenDung",
                newName: "trangThai");

            migrationBuilder.RenameColumn(
                name: "TieuDe",
                table: "tinTuyenDung",
                newName: "tieuDe");

            migrationBuilder.RenameColumn(
                name: "QuyenLoi",
                table: "tinTuyenDung",
                newName: "quyenLoi");

            migrationBuilder.RenameColumn(
                name: "NgayHetHan",
                table: "tinTuyenDung",
                newName: "ngayHetHan");

            migrationBuilder.RenameColumn(
                name: "MoTaCongViec",
                table: "tinTuyenDung",
                newName: "moTaCongViec");

            migrationBuilder.RenameColumn(
                name: "LuongToiThieu",
                table: "tinTuyenDung",
                newName: "luongToiThieu");

            migrationBuilder.RenameColumn(
                name: "LuongToiDa",
                table: "tinTuyenDung",
                newName: "luongToiDa");

            migrationBuilder.RenameColumn(
                name: "KinhNghiemYeuCau",
                table: "tinTuyenDung",
                newName: "kinhNghiemYeuCau");

            migrationBuilder.RenameColumn(
                name: "DoanhNghiepId",
                table: "tinTuyenDung",
                newName: "doanhNghiepId");

            migrationBuilder.RenameColumn(
                name: "DiaDiemLamViec",
                table: "tinTuyenDung",
                newName: "diaDiemLamViec");

            migrationBuilder.RenameColumn(
                name: "DanhMucNgheId",
                table: "tinTuyenDung",
                newName: "danhMucNgheId");

            migrationBuilder.RenameIndex(
                name: "IX_TinTuyenDung_DoanhNghiepId",
                table: "tinTuyenDung",
                newName: "IX_tinTuyenDung_doanhNghiepId");

            migrationBuilder.RenameIndex(
                name: "IX_TinTuyenDung_DanhMucNgheId",
                table: "tinTuyenDung",
                newName: "IX_tinTuyenDung_danhMucNgheId");

            migrationBuilder.RenameColumn(
                name: "TieuDe",
                table: "thongBao",
                newName: "tieuDe");

            migrationBuilder.RenameColumn(
                name: "NoiDung",
                table: "thongBao",
                newName: "noiDung");

            migrationBuilder.RenameColumn(
                name: "NguoiDungId",
                table: "thongBao",
                newName: "nguoiDungId");

            migrationBuilder.RenameColumn(
                name: "LoaiThongBao",
                table: "thongBao",
                newName: "loaiThongBao");

            migrationBuilder.RenameColumn(
                name: "IsRead",
                table: "thongBao",
                newName: "Is_Read");

            migrationBuilder.RenameIndex(
                name: "IX_ThongBao_NguoiDungId",
                table: "thongBao",
                newName: "IX_thongBao_nguoiDungId");

            migrationBuilder.RenameColumn(
                name: "VaiTro",
                table: "nguoiDung",
                newName: "vaiTro");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "nguoiDung",
                newName: "Is_Active");

            migrationBuilder.RenameIndex(
                name: "IX_NguoiDung_ApplicationUserId",
                table: "nguoiDung",
                newName: "IX_nguoiDung_ApplicationUserId");

            migrationBuilder.RenameColumn(
                name: "TrangThai",
                table: "lichPhongVan",
                newName: "trangThai");

            migrationBuilder.RenameColumn(
                name: "ThoiGianPhongVan",
                table: "lichPhongVan",
                newName: "thoiGianPhongVan");

            migrationBuilder.RenameColumn(
                name: "GhiChu",
                table: "lichPhongVan",
                newName: "ghiChu");

            migrationBuilder.RenameColumn(
                name: "DonUngTuyenId",
                table: "lichPhongVan",
                newName: "donUngTuyenId");

            migrationBuilder.RenameColumn(
                name: "DiaDiem",
                table: "lichPhongVan",
                newName: "diaDiem");

            migrationBuilder.RenameIndex(
                name: "IX_LichPhongVan_DonUngTuyenId",
                table: "lichPhongVan",
                newName: "IX_lichPhongVan_donUngTuyenId");

            migrationBuilder.RenameColumn(
                name: "SoNamKinhNghiem",
                table: "kyNangUngVien",
                newName: "soNamKinhNghiem");

            migrationBuilder.RenameColumn(
                name: "KyNangId",
                table: "kyNangUngVien",
                newName: "kyNangId");

            migrationBuilder.RenameColumn(
                name: "HoSoUngVienId",
                table: "kyNangUngVien",
                newName: "hoSoUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_KyNangUngVien_KyNangId",
                table: "kyNangUngVien",
                newName: "IX_kyNangUngVien_kyNangId");

            migrationBuilder.RenameIndex(
                name: "IX_KyNangUngVien_HoSoUngVienId",
                table: "kyNangUngVien",
                newName: "IX_kyNangUngVien_hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "TinTuyenDungId",
                table: "kyNangTinTuyenDung",
                newName: "tinTuyenDungId");

            migrationBuilder.RenameColumn(
                name: "MucDoYeuCau",
                table: "kyNangTinTuyenDung",
                newName: "mucDoYeuCau");

            migrationBuilder.RenameColumn(
                name: "KyNangId",
                table: "kyNangTinTuyenDung",
                newName: "kyNangId");

            migrationBuilder.RenameIndex(
                name: "IX_KyNangTinTuyenDung_TinTuyenDungId",
                table: "kyNangTinTuyenDung",
                newName: "IX_kyNangTinTuyenDung_tinTuyenDungId");

            migrationBuilder.RenameIndex(
                name: "IX_KyNangTinTuyenDung_KyNangId",
                table: "kyNangTinTuyenDung",
                newName: "IX_kyNangTinTuyenDung_kyNangId");

            migrationBuilder.RenameColumn(
                name: "TenKyNang",
                table: "kyNang",
                newName: "tenKyNang");

            migrationBuilder.RenameColumn(
                name: "MoTa",
                table: "kyNang",
                newName: "moTa");

            migrationBuilder.RenameIndex(
                name: "IX_KyNang_TenKyNang",
                table: "kyNang",
                newName: "IX_kyNang_tenKyNang");

            migrationBuilder.RenameColumn(
                name: "TinTuyenDungId",
                table: "ketQuaPhuHop",
                newName: "tinTuyenDungId");

            migrationBuilder.RenameColumn(
                name: "PhanLoai",
                table: "ketQuaPhuHop",
                newName: "phanLoai");

            migrationBuilder.RenameColumn(
                name: "NgayDanhGia",
                table: "ketQuaPhuHop",
                newName: "ngayDanhGia");

            migrationBuilder.RenameColumn(
                name: "HoSoUngVienId",
                table: "ketQuaPhuHop",
                newName: "hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "DiemPhuHop",
                table: "ketQuaPhuHop",
                newName: "diemPhuHop");

            migrationBuilder.RenameIndex(
                name: "IX_KetQuaPhuHop_TinTuyenDungId",
                table: "ketQuaPhuHop",
                newName: "IX_ketQuaPhuHop_tinTuyenDungId");

            migrationBuilder.RenameIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId",
                table: "ketQuaPhuHop",
                newName: "IX_ketQuaPhuHop_hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "NoiDungTrichXuat",
                table: "ketQuaPhanTichCv",
                newName: "noiDungTrichXuat");

            migrationBuilder.RenameColumn(
                name: "NgayPhanTich",
                table: "ketQuaPhanTichCv",
                newName: "ngayPhanTich");

            migrationBuilder.RenameColumn(
                name: "KyNangTrichXuat",
                table: "ketQuaPhanTichCv",
                newName: "kyNangTrichXuat");

            migrationBuilder.RenameColumn(
                name: "KinhNghiemTrichXuat",
                table: "ketQuaPhanTichCv",
                newName: "kinhNghiemTrichXuat");

            migrationBuilder.RenameColumn(
                name: "CVUngVienId",
                table: "ketQuaPhanTichCv",
                newName: "cvUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_KetQuaPhanTichCv_CVUngVienId",
                table: "ketQuaPhanTichCv",
                newName: "IX_ketQuaPhanTichCv_cvUngVienId");

            migrationBuilder.RenameColumn(
                name: "NguoiDungId",
                table: "hoSoUngVien",
                newName: "nguoiDungId");

            migrationBuilder.RenameColumn(
                name: "NgaySinh",
                table: "hoSoUngVien",
                newName: "ngaySinh");

            migrationBuilder.RenameColumn(
                name: "HoTen",
                table: "hoSoUngVien",
                newName: "hoTen");

            migrationBuilder.RenameColumn(
                name: "GioiTinh",
                table: "hoSoUngVien",
                newName: "gioiTinh");

            migrationBuilder.RenameColumn(
                name: "GioiThieu",
                table: "hoSoUngVien",
                newName: "gioiThieu");

            migrationBuilder.RenameColumn(
                name: "DiaChi",
                table: "hoSoUngVien",
                newName: "diaChi");

            migrationBuilder.RenameIndex(
                name: "IX_HoSoUngVien_NguoiDungId",
                table: "hoSoUngVien",
                newName: "IX_hoSoUngVien_nguoiDungId");

            migrationBuilder.RenameColumn(
                name: "NguoiDungId",
                table: "hoSoNhaTuyenDung",
                newName: "nguoiDungId");

            migrationBuilder.RenameColumn(
                name: "HoTen",
                table: "hoSoNhaTuyenDung",
                newName: "hoTen");

            migrationBuilder.RenameColumn(
                name: "DoanhNghiepId",
                table: "hoSoNhaTuyenDung",
                newName: "doanhNghiepId");

            migrationBuilder.RenameColumn(
                name: "ChucVu",
                table: "hoSoNhaTuyenDung",
                newName: "chucVu");

            migrationBuilder.RenameIndex(
                name: "IX_HoSoNhaTuyenDung_NguoiDungId",
                table: "hoSoNhaTuyenDung",
                newName: "IX_hoSoNhaTuyenDung_nguoiDungId");

            migrationBuilder.RenameIndex(
                name: "IX_HoSoNhaTuyenDung_DoanhNghiepId",
                table: "hoSoNhaTuyenDung",
                newName: "IX_hoSoNhaTuyenDung_doanhNghiepId");

            migrationBuilder.RenameColumn(
                name: "TrangThai",
                table: "donUngTuyen",
                newName: "trangThai");

            migrationBuilder.RenameColumn(
                name: "TinTuyenDungId",
                table: "donUngTuyen",
                newName: "tinTuyenDungId");

            migrationBuilder.RenameColumn(
                name: "NgayUngTuyen",
                table: "donUngTuyen",
                newName: "ngayUngTuyen");

            migrationBuilder.RenameColumn(
                name: "HoSoUngVienId",
                table: "donUngTuyen",
                newName: "hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "CVUngVienId",
                table: "donUngTuyen",
                newName: "cvUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId",
                table: "donUngTuyen",
                newName: "IX_donUngTuyen_tinTuyenDungId");

            migrationBuilder.RenameIndex(
                name: "IX_DonUngTuyen_HoSoUngVienId",
                table: "donUngTuyen",
                newName: "IX_donUngTuyen_hoSoUngVienId");

            migrationBuilder.RenameIndex(
                name: "IX_DonUngTuyen_CVUngVienId",
                table: "donUngTuyen",
                newName: "IX_donUngTuyen_cvUngVienId");

            migrationBuilder.RenameColumn(
                name: "Website",
                table: "doanhNghiep",
                newName: "website");

            migrationBuilder.RenameColumn(
                name: "TenDoanhNghiep",
                table: "doanhNghiep",
                newName: "tenDoanhNghiep");

            migrationBuilder.RenameColumn(
                name: "QuyMoNhanSu",
                table: "doanhNghiep",
                newName: "quyMoNhanSu");

            migrationBuilder.RenameColumn(
                name: "NguoiDaiDien",
                table: "doanhNghiep",
                newName: "nguoiDaiDien");

            migrationBuilder.RenameColumn(
                name: "MoTa",
                table: "doanhNghiep",
                newName: "moTa");

            migrationBuilder.RenameColumn(
                name: "MaSoThue",
                table: "doanhNghiep",
                newName: "maSoThue");

            migrationBuilder.RenameColumn(
                name: "LogoUrl",
                table: "doanhNghiep",
                newName: "logoUrl");

            migrationBuilder.RenameColumn(
                name: "LinhVucHoatDong",
                table: "doanhNghiep",
                newName: "linhVucHoatDong");

            migrationBuilder.RenameColumn(
                name: "DiaChi",
                table: "doanhNghiep",
                newName: "diaChi");

            migrationBuilder.RenameColumn(
                name: "TenNghe",
                table: "danhMucNghe",
                newName: "tenNghe");

            migrationBuilder.RenameColumn(
                name: "MoTa",
                table: "danhMucNghe",
                newName: "moTa");

            migrationBuilder.RenameIndex(
                name: "IX_DanhMucNghe_TenNghe",
                table: "danhMucNghe",
                newName: "IX_danhMucNghe_tenNghe");

            migrationBuilder.RenameColumn(
                name: "TenFile",
                table: "cvUngVien",
                newName: "tenFile");

            migrationBuilder.RenameColumn(
                name: "NgayUpload",
                table: "cvUngVien",
                newName: "ngayUpload");

            migrationBuilder.RenameColumn(
                name: "HoSoUngVienId",
                table: "cvUngVien",
                newName: "hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "FileUrl",
                table: "cvUngVien",
                newName: "fileUrl");

            migrationBuilder.RenameColumn(
                name: "IsDefault",
                table: "cvUngVien",
                newName: "is_Default");

            migrationBuilder.RenameIndex(
                name: "IX_CVUngVien_HoSoUngVienId",
                table: "cvUngVien",
                newName: "IX_cvUngVien_hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "TuNgay",
                table: "kinhNghiemLamViecs",
                newName: "tuNgay");

            migrationBuilder.RenameColumn(
                name: "TenCongTy",
                table: "kinhNghiemLamViecs",
                newName: "tenCongTy");

            migrationBuilder.RenameColumn(
                name: "MoTa",
                table: "kinhNghiemLamViecs",
                newName: "moTa");

            migrationBuilder.RenameColumn(
                name: "HoSoUngVienId",
                table: "kinhNghiemLamViecs",
                newName: "hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "DiaChi",
                table: "kinhNghiemLamViecs",
                newName: "diaChi");

            migrationBuilder.RenameColumn(
                name: "DenNgay",
                table: "kinhNghiemLamViecs",
                newName: "denNgay");

            migrationBuilder.RenameIndex(
                name: "IX_KinhNghiemLamViec_HoSoUngVienId",
                table: "kinhNghiemLamViecs",
                newName: "IX_kinhNghiemLamViecs_hoSoUngVienId");

            migrationBuilder.RenameColumn(
                name: "NoiDungPhanHoi",
                table: "danhGias",
                newName: "noiDungPhanHoi");

            migrationBuilder.RenameColumn(
                name: "NgayPhanHoi",
                table: "danhGias",
                newName: "ngayPhanHoi");

            migrationBuilder.RenameColumn(
                name: "KetLuan",
                table: "danhGias",
                newName: "ketLuan");

            migrationBuilder.RenameColumn(
                name: "DonUngTuyenId",
                table: "danhGias",
                newName: "donUngTuyenId");

            migrationBuilder.AlterColumn<string>(
                name: "tenCongTy",
                table: "kinhNghiemLamViecs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<bool>(
                name: "IsHienTai",
                table: "kinhNghiemLamViecs",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "diaChi",
                table: "kinhNghiemLamViecs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ketLuan",
                table: "danhGias",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_tinTuyenDung",
                table: "tinTuyenDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_thongBao",
                table: "thongBao",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_nguoiDung",
                table: "nguoiDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_lichPhongVan",
                table: "lichPhongVan",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_kyNangUngVien",
                table: "kyNangUngVien",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_kyNangTinTuyenDung",
                table: "kyNangTinTuyenDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_kyNang",
                table: "kyNang",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ketQuaPhuHop",
                table: "ketQuaPhuHop",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ketQuaPhanTichCv",
                table: "ketQuaPhanTichCv",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_hoSoUngVien",
                table: "hoSoUngVien",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_hoSoNhaTuyenDung",
                table: "hoSoNhaTuyenDung",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_donUngTuyen",
                table: "donUngTuyen",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_doanhNghiep",
                table: "doanhNghiep",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_danhMucNghe",
                table: "danhMucNghe",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_cvUngVien",
                table: "cvUngVien",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_kinhNghiemLamViecs",
                table: "kinhNghiemLamViecs",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_danhGias",
                table: "danhGias",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_cvUngVien_hoSoUngVien_hoSoUngVienId",
                table: "cvUngVien",
                column: "hoSoUngVienId",
                principalTable: "hoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_donUngTuyen_cvUngVien_cvUngVienId",
                table: "donUngTuyen",
                column: "cvUngVienId",
                principalTable: "cvUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_donUngTuyen_hoSoUngVien_hoSoUngVienId",
                table: "donUngTuyen",
                column: "hoSoUngVienId",
                principalTable: "hoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_donUngTuyen_tinTuyenDung_tinTuyenDungId",
                table: "donUngTuyen",
                column: "tinTuyenDungId",
                principalTable: "tinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_hoSoNhaTuyenDung_doanhNghiep_doanhNghiepId",
                table: "hoSoNhaTuyenDung",
                column: "doanhNghiepId",
                principalTable: "doanhNghiep",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_hoSoNhaTuyenDung_nguoiDung_nguoiDungId",
                table: "hoSoNhaTuyenDung",
                column: "nguoiDungId",
                principalTable: "nguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_hoSoUngVien_nguoiDung_nguoiDungId",
                table: "hoSoUngVien",
                column: "nguoiDungId",
                principalTable: "nguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ketQuaPhanTichCv_cvUngVien_cvUngVienId",
                table: "ketQuaPhanTichCv",
                column: "cvUngVienId",
                principalTable: "cvUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ketQuaPhuHop_hoSoUngVien_hoSoUngVienId",
                table: "ketQuaPhuHop",
                column: "hoSoUngVienId",
                principalTable: "hoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ketQuaPhuHop_tinTuyenDung_tinTuyenDungId",
                table: "ketQuaPhuHop",
                column: "tinTuyenDungId",
                principalTable: "tinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_kinhNghiemLamViecs_hoSoUngVien_hoSoUngVienId",
                table: "kinhNghiemLamViecs",
                column: "hoSoUngVienId",
                principalTable: "hoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_kyNangTinTuyenDung_kyNang_kyNangId",
                table: "kyNangTinTuyenDung",
                column: "kyNangId",
                principalTable: "kyNang",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_kyNangTinTuyenDung_tinTuyenDung_tinTuyenDungId",
                table: "kyNangTinTuyenDung",
                column: "tinTuyenDungId",
                principalTable: "tinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_kyNangUngVien_hoSoUngVien_hoSoUngVienId",
                table: "kyNangUngVien",
                column: "hoSoUngVienId",
                principalTable: "hoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_kyNangUngVien_kyNang_kyNangId",
                table: "kyNangUngVien",
                column: "kyNangId",
                principalTable: "kyNang",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_lichPhongVan_donUngTuyen_donUngTuyenId",
                table: "lichPhongVan",
                column: "donUngTuyenId",
                principalTable: "donUngTuyen",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_thongBao_nguoiDung_nguoiDungId",
                table: "thongBao",
                column: "nguoiDungId",
                principalTable: "nguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tinTuyenDung_danhMucNghe_danhMucNgheId",
                table: "tinTuyenDung",
                column: "danhMucNgheId",
                principalTable: "danhMucNghe",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tinTuyenDung_doanhNghiep_doanhNghiepId",
                table: "tinTuyenDung",
                column: "doanhNghiepId",
                principalTable: "doanhNghiep",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
