const CACHE_DURATION = 5 * 60 * 1000;

let cachedRate = null;
let lastFetch = null;

const FX_PROVIDERS = {
  primary: {
    name: 'ExchangeRate-API',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    parseRate: (data) => data.rates?.INR,
    requiresKey: false,
  },
  fallback1: {
    name: 'Fixer.io',
    url: (key) => `https://api.fixer.io/latest?base=USD&symbols=INR&access_key=${key}`,
    parseRate: (data) => data.rates?.INR,
    requiresKey: true,
    envKey: 'FIXER_API_KEY',
  },
  fallback2: {
    name: 'Open Exchange Rates',
    url: (key) => `https://openexchangerates.org/api/latest.json?app_id=${key}&symbols=INR`,
    parseRate: (data) => data.rates?.INR,
    requiresKey: true,
    envKey: 'OPEN_EXCHANGE_RATES_KEY',
  },
};

async function fetchFromProvider(provider) {
  try {
    let url = provider.url;

    if (provider.requiresKey) {
      const apiKey = process.env[provider.envKey];
      if (!apiKey) {
        console.log(`${provider.name}: API key not configured`);
        return null;
      }
      url = provider.url(apiKey);
    }

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`${provider.name} returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rate = provider.parseRate(data);

    if (!rate || typeof rate !== 'number' || rate <= 0) {
      console.warn(`${provider.name} returned invalid rate: ${rate}`);
      return null;
    }

    console.log(`${provider.name}: Successfully fetched rate ${rate}`);
    return rate;
  } catch (error) {
    console.warn(`${provider.name} error:`, error.message);
    return null;
  }
}

async function fetchLiveRate() {
  for (const provider of Object.values(FX_PROVIDERS)) {
    const rate = await fetchFromProvider(provider);
    if (rate) {
      return rate;
    }
  }

  if (cachedRate && cachedRate.rate) {
    console.warn('All providers failed, using stale cache');
    return cachedRate.rate;
  }

  throw new Error('Unable to fetch exchange rate from any provider and no cache available');
}

export async function getLiveUSDToINR() {
  const now = Date.now();

  if (cachedRate && lastFetch && (now - lastFetch) < CACHE_DURATION) {
    console.log(`Using cached rate: ${cachedRate.rate} (age: ${Math.round((now - lastFetch) / 1000)}s)`);
    return cachedRate.rate;
  }

  try {
    const rate = await fetchLiveRate();

    cachedRate = {
      rate,
      timestamp: now,
      source: 'live',
    };
    lastFetch = now;

    return rate;
  } catch (error) {
    console.error('Failed to fetch live rate:', error.message);
    throw error;
  }
}

export async function getHistoricalRate(date) {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;

  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/history/USD/${dateStr}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Historical rate API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.rates?.INR || null;
  } catch (error) {
    console.error('Failed to fetch historical rate:', error.message);
    return null;
  }
}

export function getCachedRate() {
  return cachedRate;
}

export function setCachedRate(data) {
  cachedRate = data;
  lastFetch = Date.now();
}

export function calculateSpread(baseRate, spreadPercent = 0.5) {
  return baseRate * (1 + spreadPercent / 100);
}
