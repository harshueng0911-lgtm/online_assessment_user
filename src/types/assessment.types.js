/**
 * @typedef {Object} Assessment
 * @property {string} id - Unique identifier for the assessment
 * @property {string} title - Title of the assessment (e.g. Quantitative Aptitude)
 * @property {string} company - Associated company or styling model (e.g. TCS NQT Style)
 * @property {string} category - Category (e.g. Aptitude, Coding, Psychometric)
 * @property {('Easy'|'Medium'|'Hard')} difficulty - Difficulty level
 * @property {number} durationMin - Total time allowed in minutes
 * @property {string[]} sections - Array of sections contained in the assessment
 * @property {number} questionCount - Number of questions in the assessment
 * @property {('upcoming'|'live'|'completed')} status - The current status of the assessment
 * @property {string} [startsAt] - ISO timestamp for upcoming assessments
 * @property {number} [score] - The score received if the assessment is completed
 * @property {string} description - Brief summary of what the test covers
 */

/**
 * @typedef {Object} Question
 * @property {string} id - Unique question identifier
 * @property {string} text - HTML or plain text content of the question
 * @property {('multiple-choice'|'multiple-select'|'coding'|'text')} type - The type of question
 * @property {string[]} [options] - List of possible option choices
 * @property {string[]} [correctAnswer] - The correct answer(s)
 * @property {number} [points] - Score value for answering correctly
 */

export {};
