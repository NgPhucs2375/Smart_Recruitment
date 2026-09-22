namespace Domain.Entities
{
    public class NotificationRecipient
    {
        public int NotificationId { get; set; }
        public int NguoiDungId { get; set; }
        public bool IsRead { get; set; }

        public Notification Notification { get; set; }
        public NguoiDung NguoiDung { get; set; }
    }
}