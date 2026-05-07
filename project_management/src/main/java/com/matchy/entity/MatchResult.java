package com.matchy.entity;  // ← au lieu de com.matchy.model

public class MatchResult {
    private Long freelancerId;
    private String freelancerName;
    private String freelancerSkills;
    private String freelancerAvatar;
    private boolean verified;
    private int skillsScore;     // max 40
    private int budgetScore;     // max 25
    private int experienceScore; // max 20
    private int activityScore;   // max 15
    private int totalScore;      // max 100
    private String recommendation;
    private String matchedSkills;

    public MatchResult() {}
    public void setFreelancerId(Long v)       { this.freelancerId = v; }
    public void setFreelancerName(String v)   { this.freelancerName = v; }
    public void setFreelancerSkills(String v) { this.freelancerSkills = v; }
    public void setFreelancerAvatar(String v) { this.freelancerAvatar = v; }
    public void setVerified(boolean v)        { this.verified = v; }
    public void setSkillsScore(int v)         { this.skillsScore = v; }
    public void setBudgetScore(int v)         { this.budgetScore = v; }
    public void setExperienceScore(int v)     { this.experienceScore = v; }
    public void setActivityScore(int v)       { this.activityScore = v; }
    public void setMatchedSkills(String v)    { this.matchedSkills = v; }

    public void computeTotal() {
        this.totalScore = skillsScore + budgetScore + experienceScore + activityScore;
        if      (totalScore >= 75) this.recommendation = "Excellent Match";
        else if (totalScore >= 50) this.recommendation = "Good Match";
        else if (totalScore >= 25) this.recommendation = "Fair Match";
        else                       this.recommendation = "Low Match";
    }

    public Long getFreelancerId()       { return freelancerId; }
    public String getFreelancerName()   { return freelancerName; }
    public String getFreelancerSkills() { return freelancerSkills; }
    public String getFreelancerAvatar() { return freelancerAvatar; }
    public boolean isVerified()         { return verified; }
    public int getSkillsScore()         { return skillsScore; }
    public int getBudgetScore()         { return budgetScore; }
    public int getExperienceScore()     { return experienceScore; }
    public int getActivityScore()       { return activityScore; }
    public int getTotalScore()          { return totalScore; }
    public String getRecommendation()   { return recommendation; }
    public String getMatchedSkills()    { return matchedSkills; }
}