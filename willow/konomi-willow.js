// Konomi Willow Core System
// Willow Agent — Token-efficient code processing, NLP, and compression

class TokenDB {
  constructor() {
    this.db = new Map();
    this.symbolMap = new Map([
      ['PYTHON', '\u{1F40D}'], ['JS', '\u{1F4DC}'],
      ['HTML', '\u{1F3D7}\uFE0F'], ['CSS', '\u{1F3A8}'],
      ['COMPRESS', '\u{1F4E6}'], ['CLEAN', '\u{1F9F9}'],
      ['MERGE', '\u{1F91D}'], ['SYNC', '\u{1F504}']
    ]);
  }

  addToken(key, value, category = 'general') {
    this.db.set(`${category}:${key}`, {
      value,
      symbol: this.symbolMap.get(key.toUpperCase()) || '\u26A1',
      usage: 0
    });
  }

  getToken(key, category = 'general') {
    const token = this.db.get(`${category}:${key}`);
    if (token) {
      token.usage++;
      return token;
    }
    return null;
  }

  getStats() {
    return Array.from(this.db.entries()).map(([key, data]) => ({
      key,
      usage: data.usage,
      symbol: data.symbol
    }));
  }
}

class CodeProcessor {
  constructor(language, tokenDB) {
    this.language = language;
    this.tokenDB = tokenDB;
    this.processors = new Map([
      ['PYTHON', this.processPython],
      ['JS', this.processJS],
      ['HTML', this.processHTML],
      ['CSS', this.processCSS]
    ]);
  }

  async process(code) {
    const processor = this.processors.get(this.language.toUpperCase());
    if (!processor) throw new Error(`Unsupported language: ${this.language}`);
    return await processor.call(this, code);
  }

  async processPython(code) {
    const token = this.tokenDB.getToken('PYTHON');
    return {
      type: 'python',
      symbol: token.symbol,
      analysis: {
        imports: code.match(/import \w+/g) || [],
        functions: code.match(/def \w+/g) || [],
        classes: code.match(/class \w+/g) || []
      }
    };
  }

  async processJS(code) {
    const token = this.tokenDB.getToken('JS');
    return {
      type: 'javascript',
      symbol: token.symbol,
      analysis: {
        imports: code.match(/import .* from/g) || [],
        functions: code.match(/function \w+/g) || [],
        classes: code.match(/class \w+/g) || []
      }
    };
  }

  async processHTML(code) {
    const token = this.tokenDB.getToken('HTML');
    return {
      type: 'html',
      symbol: token.symbol,
      analysis: {
        elements: code.match(/<\w+/g) || [],
        attributes: code.match(/\w+="/g) || []
      }
    };
  }

  async processCSS(code) {
    const token = this.tokenDB.getToken('CSS');
    return {
      type: 'css',
      symbol: token.symbol,
      analysis: {
        selectors: code.match(/[\.\#]\w+/g) || [],
        properties: code.match(/[\w-]+:/g) || []
      }
    };
  }
}

class NLPProcessor {
  constructor(tokenDB) {
    this.tokenDB = tokenDB;
    this.nlpFunctions = new Map([
      ['sentiment', this.analyzeSentiment],
      ['entities', this.extractEntities],
      ['keywords', this.extractKeywords]
    ]);
  }

  async process(text, functions = ['sentiment', 'entities', 'keywords']) {
    const results = {};
    for (const func of functions) {
      if (this.nlpFunctions.has(func)) {
        results[func] = await this.nlpFunctions.get(func).call(this, text);
      }
    }
    return results;
  }

  async analyzeSentiment(text) {
    const positiveWords = new Set(['good', 'great', 'excellent', 'amazing']);
    const negativeWords = new Set(['bad', 'poor', 'terrible', 'awful']);

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.has(word)) score++;
      if (negativeWords.has(word)) score--;
    });

    return {
      score,
      label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    };
  }

  async extractEntities(text) {
    return {
      names: text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [],
      dates: text.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [],
      numbers: text.match(/\d+/g) || []
    };
  }

  async extractKeywords(text) {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on']);
    const words = text.toLowerCase().split(/\s+/);
    const frequency = {};

    words.forEach(word => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

class CompressionUtil {
  constructor(tokenDB) {
    this.tokenDB = tokenDB;
  }

  async compress(content, type) {
    const token = this.tokenDB.getToken('COMPRESS');
    return {
      original: content.length,
      compressed: Math.floor(content.length * 0.7),
      type,
      symbol: token.symbol
    };
  }

  async optimize(content, type) {
    const token = this.tokenDB.getToken('CLEAN');
    return {
      original: content,
      optimized: content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        .replace(/\s+/g, ' '),
      symbol: token.symbol
    };
  }
}

class KonomiWillow {
  constructor() {
    this.tokenDB = new TokenDB();
    this.codeProcessor = new CodeProcessor('', this.tokenDB);
    this.nlpProcessor = new NLPProcessor(this.tokenDB);
    this.compressionUtil = new CompressionUtil(this.tokenDB);
    this.initialize();
  }

  initialize() {
    ['PYTHON', 'JS', 'HTML', 'CSS', 'COMPRESS', 'CLEAN', 'MERGE', 'SYNC'].forEach(
      token => this.tokenDB.addToken(token, token.toLowerCase())
    );
  }

  async processFile(content, language) {
    this.codeProcessor.language = language;
    const results = {
      code: await this.codeProcessor.process(content),
      nlp: await this.nlpProcessor.process(content),
      optimization: await this.compressionUtil.optimize(content, language),
      compression: await this.compressionUtil.compress(content, language)
    };

    return {
      ...results,
      stats: this.tokenDB.getStats()
    };
  }
}

export default KonomiWillow;
