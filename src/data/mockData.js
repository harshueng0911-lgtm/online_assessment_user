export const mockCandidates = [
  { id: "c1", name: "Aarav Sharma", email: "aarav@example.com", assessments: 4, avg: 82, status: "Active" },
  { id: "c2", name: "Diya Patel", email: "diya@example.com", assessments: 6, avg: 91, status: "Active" },
  { id: "c3", name: "Rohan Mehta", email: "rohan@example.com", assessments: 2, avg: 68, status: "Invited" },
  { id: "c4", name: "Isha Verma", email: "isha@example.com", assessments: 7, avg: 88, status: "Active" },
  { id: "c5", name: "Kabir Singh", email: "kabir@example.com", assessments: 1, avg: 54, status: "Suspended" },
  { id: "c6", name: "Sara Khan", email: "sara@example.com", assessments: 5, avg: 76, status: "Active" },
];

export const mockAnalytics = {
  weekly: [
    { day: "Mon", attempts: 24, passed: 18 },
    { day: "Tue", attempts: 31, passed: 21 },
    { day: "Wed", attempts: 28, passed: 22 },
    { day: "Thu", attempts: 45, passed: 33 },
    { day: "Fri", attempts: 52, passed: 41 },
    { day: "Sat", attempts: 18, passed: 12 },
    { day: "Sun", attempts: 9, passed: 6 },
  ],
  byCategory: [
    { name: "Aptitude", value: 42 },
    { name: "Coding", value: 31 },
    { name: "Verbal", value: 18 },
    { name: "Psychometric", value: 9 },
  ],
};
