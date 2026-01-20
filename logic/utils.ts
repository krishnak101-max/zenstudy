
export const calculatePoints = (checkinTime: string): number => {
  const date = new Date(checkinTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeValue = hours * 60 + minutes;

  if (timeValue < 5 * 60) return 50; // Before 5:00
  if (timeValue < 5 * 60 + 30) return 40; // 5:00 - 5:30
  if (timeValue < 6 * 60) return 30; // 5:30 - 6:00
  if (timeValue < 6 * 60 + 30) return 20; // 6:00 - 6:30
  return 10; // After 6:30
};

export const getMedal = (streak: number): string => {
  if (streak >= 30) return 'Champion';
  if (streak >= 15) return 'Gold';
  if (streak >= 7) return 'Silver';
  if (streak >= 3) return 'Bronze';
  return 'Seeker'; // Badge for everyone from day one
};

export const STUDY_QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "It always seems impossible until it's done. — Nelson Mandela",
  "The more that you read, the more things you will know. — Dr. Seuss",
  "Don't let what you cannot do interfere with what you can do. — John Wooden",
  "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
  "The only place where success comes before work is in the dictionary. — Vidal Sassoon",
  "There is no substitute for hard work. — Thomas Edison",
  "Knowledge is power. Information is liberating. — Kofi Annan",
  "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill"
];

export const getRandomStudyQuote = () => {
  return STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)];
};

export const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const getFormattedDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDate = (date: Date = new Date()): string => {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getFormattedDate(yesterday);
};
