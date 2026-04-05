const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'can', 'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'not', 'no',
  'all', 'both', 'each', 'more', 'most', 'other', 'some', 'into', 'over', 'also',
  'very', 'just', 'which', 'who', 'what', 'when', 'where', 'how', 'why',
  'i', 'we', 'you', 'he', 'she', 'they', 'me', 'us', 'him', 'her', 'them',
  'my', 'our', 'your', 'his', 'their', 'any', 'am', 'so', 'then', 'than',
]);

const tokenize = (text) => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
};

const hashToken64 = (token) => {
  // 64-bit FNV-1a hash (BigInt)
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < token.length; i++) {
    hash ^= BigInt(token.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash;
};

const toBinary64 = (v) => v.toString(2).padStart(64, '0');

const simHash64 = (text) => {
  const tokens = tokenize(text);
  if (!tokens.length) return '0'.repeat(64);

  const weights = new Array(64).fill(0);
  const frequencies = new Map();

  for (const t of tokens) {
    frequencies.set(t, (frequencies.get(t) || 0) + 1);
  }

  for (const [token, freq] of frequencies) {
    const h = hashToken64(token);
    for (let i = 0; i < 64; i++) {
      const bit = (h >> BigInt(i)) & 1n;
      weights[i] += bit === 1n ? freq : -freq;
    }
  }

  let fingerprint = 0n;
  for (let i = 0; i < 64; i++) {
    if (weights[i] >= 0) fingerprint |= 1n << BigInt(i);
  }

  return toBinary64(fingerprint);
};

const hammingDistance = (hashA, hashB) => {
  const a = String(hashA || '').padStart(64, '0').slice(-64);
  const b = String(hashB || '').padStart(64, '0').slice(-64);

  let distance = 0;
  for (let i = 0; i < 64; i++) {
    if (a[i] !== b[i]) distance++;
  }
  return distance;
};

const similarityFromDistance = (distance, bits = 64) => {
  const score = ((bits - distance) / bits) * 100;
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
};

const riskFromDistance = (distance) => {
  if (distance <= 5) return { riskLevel: 'high', plagiarismStatus: 'fraud' };
  if (distance <= 15) return { riskLevel: 'medium', plagiarismStatus: 'suspected' };
  return { riskLevel: 'low', plagiarismStatus: 'clean' };
};

module.exports = {
  simHash64,
  hammingDistance,
  similarityFromDistance,
  riskFromDistance,
};
