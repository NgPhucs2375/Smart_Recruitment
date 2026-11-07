namespace Application.DTOs.KetQuaPhanTichCv
{
    /// <summary>Yêu cầu chạy agent đánh giá một CV theo một tin tuyển dụng.</summary>
    public class DanhGiaCvRequest
    {
        public int CvUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
    }
}
