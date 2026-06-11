// Profanity / harmful word filter
const harmfulWords = [
  'abuse', 'attack', 'bastard', 'bitch', 'bloody', 'crap', 'damn',
  'dick', 'dumb', 'fool', 'freak', 'hate', 'hell', 'idiot', 'jerk',
  'kill', 'loser', 'moron', 'racist', 'scam', 'shit', 'slut', 'spam',
  'stupid', 'suck', 'threat', 'trash', 'ugly', 'violence', 'whore',
  'ass', 'fuck', 'nigger', 'retard', 'cunt', 'faggot'
];

/**
 * Check if text contains harmful/abusive words
 * @param {string} text - Text to check
 * @returns {{ isHarmful: boolean, detectedWords: string[] }}
 */
const checkProfanity = (text) => {
  if (!text) return { isHarmful: false, detectedWords: [] };
  
  const lowerText = text.toLowerCase();
  const detectedWords = harmfulWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });

  return {
    isHarmful: detectedWords.length > 0,
    detectedWords
  };
};

/**
 * Censor harmful words in text
 * @param {string} text - Text to censor
 * @returns {string} Censored text
 */
const censorText = (text) => {
  if (!text) return text;
  
  let censored = text;
  harmfulWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, '*'.repeat(word.length));
  });

  return censored;
};

module.exports = { checkProfanity, censorText, harmfulWords };
