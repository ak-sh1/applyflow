export const STATUSES = ["Saved", "Applied", "Interview", "Offer"];

function dateFromToday(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function createGuestDemoApplications(userId) {
  return [
    {
      user_id: userId,
      company: "Northstar Labs",
      role: "Software Engineering Intern",
      location: "Toronto · Hybrid",
      status: "Interview",
      applied_date: dateFromToday(8),
      next_step: "Prepare for technical interview",
      source: "Company careers",
      resume: "Software résumé",
      accent: "N",
      job_url: null,
      notes: "Review API design, JavaScript fundamentals and recent projects.",
    },
    {
      user_id: userId,
      company: "MapleWorks",
      role: "Frontend Developer Intern",
      location: "Remote · Canada",
      status: "Applied",
      applied_date: dateFromToday(3),
      next_step: "Follow up next Monday",
      source: "LinkedIn",
      resume: "Frontend résumé",
      accent: "M",
      job_url: null,
      notes: "React role focused on accessible, responsive product interfaces.",
    },
    {
      user_id: userId,
      company: "Cedar Finance",
      role: "Full-Stack Developer Intern",
      location: "Vancouver · Hybrid",
      status: "Offer",
      applied_date: dateFromToday(18),
      next_step: "Review offer details",
      source: "Referral",
      resume: "Full-stack résumé",
      accent: "C",
      job_url: null,
      notes: "Compare the start date, team placement and learning opportunities.",
    },
    {
      user_id: userId,
      company: "Orbit Systems",
      role: "Cloud Platform Intern",
      location: "Ottawa · On-site",
      status: "Saved",
      applied_date: null,
      next_step: "Tailor résumé by Friday",
      source: "Company careers",
      resume: "Not selected",
      accent: "O",
      job_url: null,
      notes: "Highlight backend projects, databases and deployment experience.",
    },
  ];
}
