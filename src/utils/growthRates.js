// NOTE: This script is no longer used by the app. Growth rates are now
// read directly from each card's `stat_bonus` field in character-cards.json
// (order: speed, stamina, power, guts, wisdom) via
// src/utils/umaProfiler.js -> resolveGrowth(). That data is accurate
// per-costume and doesn't require scraping GameTora. Keeping this file
// around only in case GameTora is ever needed again as a cross-check.

import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';

// This is the source of truth for card IDs — it already has a correct
// per-card `url_name` (e.g. "100101-special-week") that matches GameTora's
// URL slug exactly, so we don't need to guess/build slugs ourselves.
const dataPath = "../data/character-cards.json";

async function fetchGrowthRates(url) {
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrowthRateScraper/1.0)' }
    });
    const $ = cheerio.load(data);

    const nextData = $('#__NEXT_DATA__').html();
    if (!nextData) return null;

    const parsedData = JSON.parse(nextData);
    const charaData = parsedData?.props?.pageProps?.characterData;
    if (!charaData) return null;

    return {
        speed: charaData.growthRateSpeed || 0,
        stamina: charaData.growthRateStamina || 0,
        power: charaData.growthRatePower || 0,
        guts: charaData.growthRateGuts || 0,
        wisdom: charaData.growthRateWisdom || 0
    };
}

async function scrapeGrowthRates() {
    const cards = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (!Array.isArray(cards)) {
        throw new Error('Expected character-cards.json to contain a top-level array.');
    }


    let successCount = 0;
    let failCount = 0;

    for (const card of cards) {
        if (!card?.url_name) {
            console.warn(`[Skip] Card ${card?.card_id ?? '(unknown id)'} has no url_name`);
            failCount++;
            continue;
        }

        // Each card has its own page — this is per-outfit, not per-character,
        // so different outfits of the same Uma correctly get different rates.
        const url = `https://gametora.com/umamusume/characters/${card.url_name}`;

        try {
            const growthRates = await fetchGrowthRates(url);
            if (growthRates) {
                card.growthRates = growthRates;
                successCount++;
            } else {
                console.error(`[Failed] No characterData found for card ${card.card_id} at ${url}`);
                failCount++;
            }
        } catch (error) {
            console.error(`[Error] Failed to fetch card ${card.card_id} at ${url}: ${error.message}`);
            failCount++;
        }

        // Be polite between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fs.writeFileSync(dataPath, JSON.stringify(cards, null, 2));
}

scrapeGrowthRates();