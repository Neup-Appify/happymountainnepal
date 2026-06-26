export function classifyUserAgent(userAgent?: string | null): {
  agentCategory: string;
  isBot: boolean;
} {
  const value = (userAgent || '').toLowerCase();

  if (!value) {
    return { agentCategory: 'Person', isBot: false };
  }

  if (/googlebot|google-inspectiontool|googleother/.test(value)) {
    return { agentCategory: 'Googlebot', isBot: true };
  }

  if (/ahrefsbot|ahrefs/.test(value)) {
    return { agentCategory: 'Ahrefs', isBot: true };
  }

  if (/perplexitybot|perplexity-user|perplexity/.test(value)) {
    return { agentCategory: 'Perplexity AI', isBot: true };
  }

  if (/gptbot|chatgpt-user|oai-searchbot|openai/.test(value)) {
    return { agentCategory: 'ChatGPT AI', isBot: true };
  }

  if (/claudebot|claude-web|anthropic|bytespider|cohere-ai|meta-externalagent|amazonbot|ccbot|youbot|phind|exa|mistral/.test(value)) {
    return { agentCategory: 'Other AI', isBot: true };
  }

  if (/bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|petalbot|seznambot|qwantbot/.test(value)) {
    return { agentCategory: 'Search Engine', isBot: true };
  }

  if (/semrushbot|dotbot|mj12bot|rogerbot|siteauditbot/.test(value)) {
    return { agentCategory: 'SEO Crawler', isBot: true };
  }

  if (/bot|crawler|spider|crawl|preview/.test(value)) {
    return { agentCategory: 'Other Bot', isBot: true };
  }

  return { agentCategory: 'Person', isBot: false };
}

export function getBotIdentifier(userAgent?: string | null, fallbackIdentifier?: string | null): string {
  const classification = classifyUserAgent(userAgent);

  if (!classification.isBot) {
    return fallbackIdentifier?.trim() || 'notdefined';
  }

  if (classification.agentCategory !== 'Other Bot') {
    return classification.agentCategory;
  }

  const firstToken = (userAgent || '').trim().split(/\s+/)[0] || '';
  const cleaned = firstToken.split('/')[0]?.trim();

  return cleaned || fallbackIdentifier?.trim() || 'Other Bot';
}

export function classifyReferrerSource(referrer?: string | null): string {
  if (!referrer) {
    return 'Direct';
  }

  try {
    const hostname = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');

    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      return 'ChatGPT';
    }

    if (hostname.includes('perplexity.ai')) {
      return 'Perplexity';
    }

    if (hostname.includes('claude.ai')) {
      return 'Claude';
    }

    if (hostname.includes('copilot.microsoft.com')) {
      return 'Microsoft Copilot';
    }

    if (hostname.includes('gemini.google.com')) {
      return 'Gemini';
    }

    if (hostname.includes('ahrefs.com')) {
      return 'Ahrefs';
    }

    if (hostname.includes('google.')) {
      return 'google.com';
    }

    if (hostname.includes('bing.com')) {
      return 'bing.com';
    }

    if (hostname.includes('search.yahoo.com') || hostname.includes('yahoo.com')) {
      return 'yahoo.com';
    }

    if (hostname.includes('duckduckgo.com')) {
      return 'duckduckgo.com';
    }

    if (hostname.includes('baidu.com')) {
      return 'baidu.com';
    }

    if (hostname.includes('yandex.')) {
      return 'yandex.com';
    }

    if (hostname.includes('ecosia.org')) {
      return 'ecosia.org';
    }

    if (hostname.includes('search.brave.com')) {
      return 'search.brave.com';
    }

    return hostname;
  } catch {
    return referrer;
  }
}

export function normalizeStoredReferrerSource(referrerSource?: string | null, referrer?: string | null): string {
  const value = (referrerSource || '').trim();

  if (
    value === 'Google Search' ||
    value === 'Bing Search' ||
    value === 'Yahoo Search' ||
    value === 'DuckDuckGo' ||
    value === 'Baidu' ||
    value === 'Yandex' ||
    value === 'Ecosia' ||
    value === 'Brave Search'
  ) {
    return classifyReferrerSource(referrer);
  }

  return value || classifyReferrerSource(referrer);
}
