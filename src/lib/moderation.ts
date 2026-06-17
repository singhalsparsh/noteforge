// ============================================================
// NoteForge - Content Moderation
// Blocks vulgar/offensive content in English, Hindi, Hinglish
// ============================================================

// Expanded blocklist covering English, Hindi, and Hinglish vulgar terms
const BLOCKED_WORDS = [
  // English vulgar
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckers', 'motherfucker',
  'shit', 'shitting', 'shitted', 'bullshit', 'horseshit',
  'ass', 'asshole', 'assholes', 'bitch', 'bitches', 'bitching',
  'bastard', 'bastards', 'damn', 'dammit', 'goddamn',
  'cock', 'dick', 'dickhead', 'penis', 'pussy', 'cunt',
  'whore', 'slut', 'sluts', 'bimbo',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'piss', 'pissing', 'pissed',
  'douche', 'douchebag', 'jackass',
  'dumbass', 'dipshit', 'shithead',
  'motherfucking', 'goddamned', 'cocksucker',
  'twat', 'wanker', 'bollocks', 'arse', 'arsehole',
  'bloody', 'bugger',

  // Hindi vulgar
  'bhenchod', 'behenchod', 'bc', 'madharchod', 'mc', 'madarchod',
  'bhosdike', 'bhosdiwala', 'bhosda', 'bhosadi',
  'chutiya', 'chutiye', 'chut', 'chutmarani',
  'gaand', 'gaandu', 'gandu', 'gand',
  'laudu', 'lauda', 'loda', 'lod',
  'tatti', 'tatty',
  'kutti', 'kutta',
  'kamina', 'kamini',
  'harami', 'haraami',
  'sala', 'sali', 'salo',
  'randi', 'randibaaz',
  'bhadva', 'bhadwa',
  'bawli', 'bawla',
  'ullu', 'ullu ke patha',
  'moot', 'moota', 'mooti',
  'hijra', 'chakka',
  'nunni', 'lulli',
  'jhat', 'jhatu', 'jhaat',
  'bhen ke lode', 'baap ke lode',
  'gand mara', 'gand maraye',

  // Hinglish / mixed
  'fuck you', 'fk you', 'fck u', 'fcku',
  'suck my', 'blowjob', 'handjob',
  'sex', 'sexy', 'horny', 'porn',
  'xxx', 'sex video',
  'loda le', 'lauda le',
  'gaand me',
  'bhad mein',
  'chutiya banaya',
  'rape', 'rapist',
  'kill yourself', 'kys',
  'dumb fuck', 'stupid fuck',

  // Mild but still blocked in names/chat
  'idiot', 'moron', 'imbecile',
].map(w => w.toLowerCase());

export function containsVulgarContent(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();

  // Check exact matches first
  if (BLOCKED_WORDS.some(word => lower === word)) return true;

  // Check as word boundaries (word surrounded by non-alphanumeric)
  const words = lower.split(/[\s,.;:!?()\[\]{}"'\-_/@#$%^&*+=<>~`|\\]+/).filter(Boolean);
  return BLOCKED_WORDS.some(word => words.includes(word));
}

export function moderateText(text: string): { clean: string; blocked: boolean } {
  if (!text) return { clean: text, blocked: false };

  if (containsVulgarContent(text)) {
    return {
      clean: '[Content moderated]',
      blocked: true,
    };
  }

  return { clean: text, blocked: false };
}

export function moderateName(name: string): { clean: string; blocked: boolean } {
  if (!name) return { clean: name, blocked: false };

  const trimmed = name.trim().slice(0, 30); // Max length

  if (!trimmed) return { clean: 'Anonymous', blocked: false };

  if (containsVulgarContent(trimmed)) {
    return { clean: '[Moderated]', blocked: true };
  }

  return { clean: trimmed, blocked: false };
}

export function checkFileSize(file: File, maxMB: number = 5): { valid: boolean; message: string } {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxMB}MB allowed.`,
    };
  }
  return { valid: true, message: '' };
}
