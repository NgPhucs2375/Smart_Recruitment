namespace Application.Services.Matching
{
    public class MatchingWeightOptions
    {
        public const string SectionName = "MatchingWeights";
        
        public double SkillWeight { get; set; } = 0.60;
        public double ExperienceWeight { get; set; } = 0.25;
        public double EducationWeight { get; set; } = 0.15;
        
        // Skill demand multipliers
        public double MandatoryWeight { get; set; } = 3.0;    // BatBuc
        public double PreferredWeight { get; set; } = 1.5;    // UuTien
        public double NiceToHaveWeight { get; set; } = 0.5;   // KhongBatBuoc
        
        // Penalties/bonuses
        public double MissingMandatoryPenalty { get; set; } = -0.30;
        public double ProficiencyBonusPerLevel { get; set; } = 0.05;
        public double ExperienceFullScoreYears { get; set; } = 5.0; // 5+ years = max exp score
    }
}