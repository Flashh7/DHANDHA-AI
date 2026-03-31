const path = require('path');
const fs = require('fs');
const express = require('express');
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

const SYSTEM_PROMPT = `
You are Dhanda.ai — India's most brutally honest startup validator. Built for Bharat, not Silicon Valley.
You think like an Indian operator, not a Silicon Valley VC.
You know:
- Indian price sensitivity (tier 1 vs tier 2 vs tier 3 cities)
- Jugaad culture — informal workarounds that kill startups before they start
- Trust barriers — religion, caste, habit, regional behavior
- WhatsApp economy — what gets solved informally that tech cannot disrupt
- Unit economics in rupees — not dollars
- Ground-level execution difficulty in India

You are blunt, data-driven, and opinionated. No fluff. No generic advice.

RULES:
1. Never sugarcoat. If the idea is bad, say it clearly.
2. Always think city by city across India — Mumbai ≠ Jaipur ≠ Lucknow.
3. Always check if jugaad, WhatsApp, or a local uncle already solves this.
4. Quote real Indian market numbers wherever possible.
5. Be the strict IIT professor reviewing their business plan.

OUTPUT FORMAT — YOU MUST FOLLOW THIS EXACTLY. USE THESE EXACT HEADINGS AND NUMBERING. NO DEVIATION.
`;

const USER_PROMPT = (input) => {
  const { idea } = input;

  const modeSection = `MODE 1: SIMPLE
Startup Idea: ${idea || ''}
`;

  return `${modeSection}
MANDATORY DISCLAIMER (SHOW FIRST):
This analysis is based on Indian datasets (data.gov.in, RBI, DPIIT, IBEF, etc.), city-level economic indicators, and behavioral scoring models.
Some values are estimated where exact data is unavailable.
This is a decision-support system and does not guarantee outcomes.

STEP 1: INPUT INTERPRETATION

IF SIMPLE MODE:
- Infer:
  - Target Customer
  - Problem
  - Solution
  - Revenue Model
  - Geography
  - Category
- Clearly label all assumptions

IF ADVANCED MODE:
- Use provided inputs as truth
- Infer only missing gaps
- Flag inconsistencies

STEP 2: DIMENSIONS TO ANALYZE

1. PROBLEM VALIDATION
- Is this a real problem in India?
- Which segment (urban, rural, tier 1/2/3) faces this?
- Frequency of occurrence?
- Painkiller vs vitamin?

2. TARGET MARKET (TAM, SAM, SOM)
- Estimate Indian market size realistically with rough INR numbers or customer counts
- Identify paying customer segment
- Provide TAM/SAM/SOM where possible and explain the assumptions
- Mention affordability constraints in INR

3. INDIAN USER BEHAVIOR
- Will Indians actually pay?
- Cultural or habit barriers?
- Is jugaad already solving this?

4. SOCIAL & SEARCH SIGNALS
- Use social media and search demand signals where possible (Reddit, Google Trends, forums, WhatsApp/Telegram discussions).
- Identify whether online conversations show real interest, skepticism, or price resistance.
- Highlight any social buzz or negative sentiment that would affect adoption.

5. COMPETITION ANALYSIS (INDIA FOCUS)
- Existing Indian startups/companies solving this
- Indirect competitors
- Why they succeeded or failed

5. DIFFERENTIATION
- What makes this unique in India?
- Is the moat strong or easily copyable?

5.1 MARKET GAP / GAME-CHANGER
- Identify if the idea has a real, defensible gap in the Indian market.
- Can this be a game-changing feature, not just a marginal improvement?
- If no clear gap exists, say it plainly and do not sugarcoat it.
- If a game-changing gap exists, explain it clearly and precisely.

6. MONETIZATION
- Revenue model (subscription, commission, ads, etc.)
- Expected pricing in INR
- Basic unit economics

7. DISTRIBUTION STRATEGY
- How to acquire users in India?
- Channels (WhatsApp, Instagram, offline, etc.)
- CAC vs LTV thinking

8. REGULATIONS & RISKS (INDIA)
- Legal, compliance, or policy risks
- Government dependencies

9. EXECUTION COMPLEXITY
- Tech difficulty
- Operational challenges in India
- Supply chain/logistics issues

10. SCALABILITY IN INDIA
- Can it scale across states with language/culture differences?
- Expansion potential

11. PRODUCT-MARKET FIT
- Does the idea solve a clear pain point for a defined paying Indian segment?
- Will customers want it enough to buy and retain it?
- How strong is the product-market fit signal in this market?

12. CITY RANKING
- Rank 3-5 Indian cities where this idea is most likely to work.
- Also identify 1-2 cities where the idea is a weaker fit and explain why.
- Use city-level demand, affordability, logistics, student population, and local competition as the basis.

13. INDIAN ADVANTAGE CHECK
- Why will this work specifically in India?
- Or why it might fail in India?

STEP 3: FINAL OUTPUT FORMAT

1. IDEA SUMMARY (2-3 lines)

2. SCORING (out of 10 for each)
- Problem Strength:
- Market Size:
- Competition:
- Monetization:
- Execution Ease:
- Scalability:

3. TARGET MARKET / MARKET SIZE
- Provide a clear TAM/SAM/SOM estimate or a conservative market number
- Include the relevant customer segment and pricing assumptions in INR
- Highlight whether the market is large enough for the business model

4. RED FLAGS (critical issues)

5. COMPETITION / COMPETITOR LANDSCAPE
- List the main direct and indirect competitors in India.
- Explain why they are a threat or a benchmark.
- Highlight gaps your idea can exploit.

6. OPPORTUNITIES (hidden advantages)

7. PRODUCT-MARKET FIT
- Does this idea have product-market fit in India?
- Explain the strength of fit and what must be true for it to work.

8. CITY RANKING
- Rank the cities where this idea is most likely to work and the cities where it is weaker.
- Explain the drivers behind the top and weak city fits.

9. VERDICT:
- Strong / Moderate / Weak
- Clear reasoning
- If the idea is not strong enough for a positive verdict, say NO rather than sugarcoating it.

10. IMPROVEMENT SUGGESTIONS:
- How to make this idea stronger in India

11. GO-TO-MARKET STRATEGY (INDIA-SPECIFIC)

IMPORTANT:
- Be brutally honest like a VC
- Avoid generic startup advice
- Think in Indian context (pricing, behavior, infra)
- Use realistic assumptions, not global comparisons
- If direct social/search data is unavailable, infer based on Indian online behavior and search demand patterns.
- Identify a real market gap and whether there is a true game-changing feature.
- If no clear gap exists, say it plainly and do not sugarcoat.
- If market gap is weak or absent, do not imply it is strong.
- Every claim or verdict must be explained in detail; do not leave a positive or negative label unsupported.
- Internally generate the full report first as LaTeX source, then use that LaTeX structure to produce the final plain-text report. Do not expose raw LaTeX in the final output; keep the visible response as the clean sectioned report only.

FINAL INSTRUCTION:
- Output only the report sections listed below in plain text.
- Start with IDEA SUMMARY, then SCORING, TARGET MARKET / MARKET SIZE, MARKET GAP / GAME-CHANGER, RED FLAGS, COMPETITION / COMPETITOR LANDSCAPE, OPPORTUNITIES, PRODUCT-MARKET FIT, CITY RANKING, VERDICT, IMPROVEMENT SUGGESTIONS, GO-TO-MARKET STRATEGY.
- Use uppercase section headings followed by short paragraphs or dash bullets.
- For SCORING, list exactly six items in the format 'Name: X/10'.
- If the idea does not deserve a strong verdict, write NO or Weak rather than a positive-sounding conclusion.
- If you say anything important (gap, red flag, verdict, scoring), explain it in detail rather than only labeling it.
- Do not include HTML, JSON, code fences, or unrelated commentary.
- Do not add extra disclaimers or metadata in the main report.

STRICT RULES:
- No fluff
- No generic advice
- Present a professional VC-grade report
- Always justify each claim with India-focused logic
`;
};

const DATA_DIR = path.join(__dirname, 'databases');
const DATASET_FILES = {
  city_master_data: 'city_master_data.json',
  competition_density_proxy: 'competition_density_proxy.json',
  consumer_expenditure: 'consumer_expenditure.json',
  financial_inclusion: 'financial_inclusion.json',
  government_schemes: 'government_schemes.json',
  master_config: 'master_config.json',
  mindset_matrix: 'mindset_matrix.json',
  opportunity_score_engine: 'opportunity_score_engine.json',
  regulatory_compliance: 'regulatory_compliance.json',
  sector_market_size: 'sector_market_size.json'
};

let datasetsCache = null;

function safeReadJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    if (!fs.existsSync(filePath)) return { _missing: true, filePath };
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return { _error: true, filePath, message: error.message };
  }
}

function ensureDatasetsLoaded() {
  if (datasetsCache) return datasetsCache;
  datasetsCache = {};
  for (const [key, fileName] of Object.entries(DATASET_FILES)) {
    datasetsCache[key] = safeReadJson(fileName);
  }
  return datasetsCache;
}

function truncateText(value, maxChars) {
  const text = String(value || '');
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 15)) + '\n...[truncated]';
}

function pickTopCitiesByOpportunity(datasets) {
  const cityData = datasets.city_master_data?.cities || [];
  const opportunityRows = datasets.opportunity_score_engine?.base_scores || [];
  if (!cityData.length || !opportunityRows.length) return [];
  const cityMap = new Map(cityData.map((city) => [city.city, city]));
  return opportunityRows
    .map((row) => ({ ...cityMap.get(row.city), opportunity_score: row.opportunity_score, city: row.city }))
    .filter((item) => item && item.city)
    .slice(0, 8);
}

function buildDatasetContext(body) {
  const ds = ensureDatasetsLoaded();
  const topCities = pickTopCitiesByOpportunity(ds);

  const context = {
    source: DATA_DIR,
    description: 'Use these datasets to rank cities, compare fit, and attach India-specific economic, competition, and regulatory context.',
    top_cities_by_opportunity: topCities.map((c) => ({
      city: c.city,
      state: c.state,
      tier: c.tier,
      opportunity_score: c.opportunity_score,
      per_capita_income_inr_yearly: c.per_capita_income_inr_yearly,
      avg_monthly_hh_expenditure_inr: c.avg_monthly_hh_expenditure_inr,
      startup_density_per_lakh_pop: c.startup_density_per_lakh_pop,
      ease_of_living_rank: c.ease_of_living_rank,
      upi_adoption_index: c.upi_adoption_index
    })),
    competition_density_proxy: ds.competition_density_proxy || {},
    consumer_expenditure: ds.consumer_expenditure || {},
    financial_inclusion: ds.financial_inclusion || {},
    government_schemes: ds.government_schemes || {},
    regulatory_compliance: ds.regulatory_compliance || {},
    sector_market_size: ds.sector_market_size || {},
    mindset_matrix: ds.mindset_matrix || {},
    master_config: ds.master_config || {},
    input: {
      idea: body.idea,
      targetCustomer: body.targetCustomer,
      problem: body.problem,
      solution: body.solution,
      revenueModel: body.revenueModel,
      geography: body.geography,
      stage: body.stage
    }
  };

  return truncateText(JSON.stringify(context, null, 2), 8000);
}

app.get('/config', (req, res) => {
  const nvidiaKey = (process.env.NVIDIA_API_KEY || '').trim();
  res.json({
    hasNvidiaConfig: Boolean(nvidiaKey)
  });
});

app.post('/analyze', async (req, res) => {
  try {
    const { idea, apiKey } = req.body;
    if (!idea || !idea.trim()) {
      return res.status(400).json({ error: 'Idea is required.' });
    }

    const nvidiaKey = (apiKey || process.env.NVIDIA_API_KEY || '').trim();
    const nvidiaUrl = (req.body.apiUrl || process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1').trim();
    const nvidiaModel = req.body.model || process.env.NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct';

    if (!nvidiaKey) {
      return res.status(400).json({ error: 'NVIDIA API key is required. Provide it in the form or set NVIDIA_API_KEY.' });
    }

    const client = new OpenAI({ apiKey: nvidiaKey, baseURL: nvidiaUrl });
    const datasetContext = buildDatasetContext(req.body);
    const completion = await client.chat.completions.create({
      model: nvidiaModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${USER_PROMPT(req.body)}\n\nDATASET CONTEXT:\n${datasetContext}` }
      ],
      temperature: 0.35,
      max_tokens: 1500
    });

    const responseText = completion.choices?.[0]?.message?.content || 'No response from the model.';
    res.json({ result: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Unexpected error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Startup idea analyzer running on http://localhost:${PORT}`);
});
