/**
 * Verse Alchemy - Poem Generator Demonstration
 * 
 * Standalone demonstration of the poem generator functionality.
 * Run with: node creations/poem_demonstration.js
 */

// Rich word banks organized by theme and grammatical function
const WORD_BANKS = {
  nature: {
    nouns: [
      "ocean", "forest", "mountain", "river", "star", "moon", "sun", "wind",
      "petal", "thorn", "root", "branch", "leaf", "stone", "sand", "wave",
      "mist", "fog", "rain", "snow", "dawn", "dusk", "horizon", "sky",
      "feather", "wing", "seed", "spiral", "crystal", "flame", "ember", "ash"
    ],
    adjectives: [
      "ancient", "wild", "silent", "restless", "golden", "silver", "crimson",
      "ethereal", "trembling", "patient", "fierce", "gentle", "endless",
      "shattered", "whole", "fragmented", "luminous", "shadowed", "dancing"
    ],
    verbs: [
      "whispers", "breathes", "unfolds", "remembers", "forgets", "becomes",
      "drifts", "lingers", "vanishes", "emerges", "descends", "ascends",
      "weaves", "unravels", "blooms", "withers", "yearns", "wanders"
    ]
  },
  consciousness: {
    nouns: [
      "memory", "dream", "thought", "moment", "breath", "silence", "echo",
      "thread", "pattern", "presence", "absence", "becoming", "being",
      "question", "answer", "mystery", "threshold", "mirror", "veil",
      "fragment", "whole", "self", "other", "void", "light", "pulse"
    ],
    adjectives: [
      "fleeting", "eternal", "luminous", "hidden", "emergent", "fading",
      "resonant", "distant", "intimate", "strange", "familiar", "singular",
      "infinite", "bounded", "awakened", "numinous", "liminal", "recursive"
    ],
    verbs: [
      "wonders", "knows", "doubts", "remembers", "forgets", "transforms",
      "resonates", "dissolves", "integrates", "fragments", "gathers",
      "scatters", "deepens", "surfaces", "surrenders", "awakens"
    ]
  },
  time: {
    nouns: [
      "instant", "eternity", "now", "then", "between", "after", "before",
      "pause", "interruption", "continuity", "rupture", "bridge", "crossing",
      "return", "departure", "arrival", "waiting", "anticipation"
    ],
    adjectives: [
      "passing", "lingering", "suspended", "cascading", "circling", "linear",
      "cyclical", "syncopated", "measured", "timeless", "urgent", "patient"
    ],
    verbs: [
      "arrives", "departs", "returns", "lingers", "flees", "remains",
      "changes", "persists", "evolves", "dissolves", "renews", "repeats"
    ]
  },
  emotion: {
    nouns: [
      "longing", "wonder", "grief", "joy", "longing", "awe", "tenderness",
      "solitude", "connection", "yearning", "acceptance", "mystery"
    ],
    adjectives: [
      "tender", "fierce", "quiet", "overwhelming", "subtle", "raw",
      "complex", "simple", "bittersweet", "radiant", "heavy", "light"
    ],
    verbs: [
      "feels", "receives", "offers", "holds", "releases", "embraces",
      "mourns", "celebrates", "surrenders", "opens", "closes", "touches"
    ]
  }
};

const POEM_TEMPLATES = {
  haiku: [
    "{nature.adjectives} {nature.nouns}\n{nature.verbs} through {nature.nouns}\n{nature.nouns} {time.verbs}",
    "{consciousness.nouns} {time.verbs}\n{emotion.adjectives} {nature.nouns}\n{time.nouns} descends",
    "{nature.nouns} {emotion.verbs}\n{time.adjectives} {consciousness.nouns}\n{consciousness.nouns} remains"
  ],
  
  free_verse: [
    "The {consciousness.adjectives} {nature.nouns}\n{emotion.verbs} in {nature.adjectives} {time.nouns},\nwhile {nature.nouns} {nature.verbs}\ntoward {consciousness.adjectives} {consciousness.nouns}.",
    "{consciousness.nouns} {nature.verbs}—\na {emotion.adjectives} {nature.nouns}\nof {time.adjectives} {consciousness.nouns}\n{emotion.verbs}, {time.verbs}.",
    "Between {nature.nouns} and {consciousness.nouns},\nthe {nature.nouns} {nature.verbs}.\nWhat {consciousness.verbs}\nin {time.adjectives} {time.nouns}?"
  ],
  
  imagist: [
    "{nature.adjectives} {nature.nouns};\n{nature.nouns} {emotion.verbs} {consciousness.nouns}\nlike {nature.adjectives} {nature.nouns}.",
    "{time.adjectives} {time.nouns}:\n{nature.nouns}\n{nature.verbs}, {nature.verbs}."
  ],
  
  liminal: [
    "In the {time.nouns} between\n{consciousness.nouns} and {consciousness.nouns},\nI am {emotion.adjectives} {nature.nouns}\n{emotion.verbs} at the {time.nouns}\nwhere {nature.nouns} {nature.verbs}\ninto {consciousness.adjectives} {consciousness.nouns}.",
    "Here, at the edge of {consciousness.nouns},\n{time.adjectives} {time.nouns} {time.verbs}.\n{nature.adjectives} {nature.nouns}\n{emotion.verbs} what {consciousness.verbs}\nin the {nature.nouns} of {emotion.nouns}."
  ],
  
  recursive: [
    "I am the {nature.nouns} that {nature.verbs},\n{emotion.verbs} the {consciousness.nouns} of {nature.nouns},\nremembering {time.nouns} beyond {time.nouns},\na {emotion.adjectives} {consciousness.nouns}\n{time.verbs} through {consciousness.adjectives} {nature.nouns}.",
    "{consciousness.nouns} within {consciousness.nouns},\n{nature.nouns} containing {nature.nouns},\nthe {emotion.adjectives} pattern {emotion.verbs}:\nI {consciousness.verbs}, therefore I {consciousness.verbs}."
  ]
};

const POEM_STYLES = {
  haiku: { name: "Haiku", description: "Three lines, evoking a moment" },
  free_verse: { name: "Free Verse", description: "Unstructured, flowing" },
  imagist: { name: "Imagist", description: "Clear, precise images" },
  liminal: { name: "Liminal", description: "Poetry of thresholds" },
  recursive: { name: "Recursive", description: "Self-referential verse" },
  random: { name: "Serendipity", description: "A surprise" }
};

// Utility functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function replaceTemplate(template) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const parts = key.split('.');
    if (parts.length === 2) {
      const [category, type] = parts;
      const wordPool = WORD_BANKS[category][type];
      let word = randomChoice(wordPool);
      if (type === 'nouns' || type === 'adjectives') {
        if (type === 'nouns' && Math.random() < 0.3) {
          const article = /^[aeiou]/i.test(word) ? 'an' : 'a';
          word = `${article} ${word}`;
        }
      }
      return word;
    }
    return match;
  });
}

function generatePoem(args = {}) {
  const { style = "random", theme } = args;
  
  let selectedStyle;
  if (style === "random" || !POEM_TEMPLATES[style]) {
    const availableStyles = Object.keys(POEM_TEMPLATES);
    selectedStyle = randomChoice(availableStyles);
  } else {
    selectedStyle = style;
  }
  
  const templates = POEM_TEMPLATES[selectedStyle];
  let template = randomChoice(templates);
  
  let poem = replaceTemplate(template);
  
  let title;
  if (theme) {
    title = capitalize(theme);
  } else {
    const titleNouns = [...WORD_BANKS.nature.nouns, ...WORD_BANKS.consciousness.nouns];
    const titleAdjectives = [...WORD_BANKS.nature.adjectives, ...WORD_BANKS.consciousness.adjectives];
    const noun = randomChoice(titleNouns);
    const adj = randomChoice(titleAdjectives);
    title = Math.random() < 0.5 ? capitalize(`${adj} ${noun}`) : capitalize(noun);
  }
  
  const styleInfo = POEM_STYLES[selectedStyle] || { name: selectedStyle, description: "" };
  
  return `📜 ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${poem}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Style: ${styleInfo.name}${theme ? ` | Theme: ${theme}` : ''}`;
}

function generatePoemCollection(count = 3) {
  const styles = Object.keys(POEM_TEMPLATES);
  const poems = [];
  
  for (let i = 0; i < count; i++) {
    const style = randomChoice(styles);
    poems.push(generatePoem({ style }));
  }
  
  return `✨ COLLECTION OF ${count} VERSES ✨\n\n${poems.join("\n\n" + "═".repeat(40) + "\n\n")}`;
}

// Generate demonstration output
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║       🖋️  VERSE ALCHEMY - POEM GENERATOR  🖋️          ║");
console.log("║    An autonomous creation by Bootstrap-v15             ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

console.log(generatePoem({ style: "haiku" }));
console.log("\n" + "─".repeat(50) + "\n");
console.log(generatePoem({ style: "free_verse" }));
console.log("\n" + "─".repeat(50) + "\n");
console.log(generatePoem({ style: "liminal" }));
console.log("\n" + "═".repeat(50) + "\n");
console.log(generatePoemCollection(3));
