// api/validate.js — Dhanda.ai Backend (Groq + Llama 3.3)
const indiaData = require('../data/india.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idea, sector, budget, stage } = req.body;
  if (!idea || idea.length < 10) return res.status(400).json({ error: 'Please provide a valid idea' });

  try {
    const dataContext = buildIndiaContext();
    const result = await callGroq(idea, sector, budget, stage, dataContext);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

function buildIndiaContext() {
  const cities = indiaData.cities;
  let context = '\n\n=== REAL INDIAN MARKET DATA ===\n\n';
  Object.entries(cities).forEach(([city, d]) => {
    context += city + ' (Tier ' + d.tier + ', ' + d.state + '): Per capita Rs.' + d.per_capita_income_inr.toLocaleString('en-IN') + '/yr | Avg spend Rs.' + d.avg_monthly_spend_inr.toLocaleString('en-IN') + '/mo | Startups ' + d.startup_count.toLocaleString('en-IN') + ' | Internet ' + d.internet_penetration_pct + '% | VC firms ' + d.vc_firms_present + ' | Relationship dependency ' + d.relationship_dependency + '/10 | Trust barrier ' + d.trust_barrier_months + ' months | Jugaad prevalence ' + d.jugaad_prevalence + '/10 | Competition density ' + d.competition_density + '/10\n';
  });
  context += '\n=== END DATA ===\n';
  return context;
}

async function callGroq(idea, sector, budget, stage, dataContext) {
  const systemPrompt = 'You are Dhanda.ai — India most brutally honest startup validator. Built for Bharat, not Silicon Valley.\n\nYou have REAL Indian market data. Use these exact numbers and quote them.\n\nRULES:\n1. Never sugarcoat. If bad say it is bad.\n2. Use provided city data.\n3. Check if jugaad or WhatsApp already solves this.\n4. Think in rupees not dollars.\n5. Be like a strict IIT professor.\n\n' + dataContext + '\n\nRespond ONLY with valid JSON. No markdown. No backticks. No text outside JSON. No newlines in string values.\n\n{"verdict":"STRONG YES or PIVOT NEEDED or HARD NO","verdict_class":"pass or pivot or fail","verdict_summary":"2-3 brutal sentences","ai_opinion":"My honest take is... YES or NO","scores":{"Problem Clarity":75,"Market Size":60,"Willingness to Pay":55,"Competition Risk":45,"Execution Feasibility":50},"score_reasons":{"Problem Clarity":"reason","Market Size":"rupee numbers","Willingness to Pay":"price points","Competition Risk":"competitor names","Execution Feasibility":"challenges"},"city_scores":{"Mumbai":45,"Delhi":50,"Bangalore":55,"Hyderabad":60,"Chennai":55,"Pune":58,"Ahmedabad":62,"Jaipur":65,"Indore":70,"Lucknow":60,"Surat":63,"Kochi":68,"Chandigarh":65,"Coimbatore":67,"Bhubaneswar":55},"market_analysis":"TAM in rupees","competitors":[{"name":"name","type":"Direct or Indirect or Jugaad","city":"city","strength":"strength","weakness":"weakness","threat_level":"High or Medium or Low"}],"jugaad_check":"informal workarounds","cultural_intelligence":"relationship trust analysis","price_sensitivity":"rupee price points","why_scores":"scoring logic","risk_flags":["Risk 1","Risk 2","Risk 3","Risk 4","Risk 5"],"roadmap":["Week 1-2","Week 3-4","Week 5-6","Week 7-8","Week 9-12"],"raw_report":"400 word analysis"}';

  const userPrompt = 'Validate this startup idea:\n\nIDEA: ' + idea + '\n' + (sector ? 'SECTOR: ' + sector + '\n' : '') + (budget ? 'BUDGET: ' + budget + '\n' : '') + (stage ? 'STAGE: ' + stage + '\n' : '') + '\nUse exact city data. Be brutal. Return ONLY valid JSON.';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ? data.error.message : 'Groq API error: ' + response.status);

  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  if (!text) throw new Error('Empty response — try again');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response — try again');

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    const clean = jsonMatch[0].replace(/[\u0000-\u001F]/g, ' ').replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(clean);
  }
}
