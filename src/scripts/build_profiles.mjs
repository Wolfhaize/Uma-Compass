import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAllProfiles } from '../utils/umaProfiler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

const cards = JSON.parse(fs.readFileSync(path.join(dataDir, 'character-cards.json'), 'utf8'))
const skillData = JSON.parse(fs.readFileSync(path.join(dataDir, 'skill_data.json'), 'utf8'))
const skillNames = JSON.parse(fs.readFileSync(path.join(dataDir, 'skillnames.json'), 'utf8'))
const growthConditions = JSON.parse(fs.readFileSync(path.join(dataDir, 'uma_growth_conditions.json'), 'utf8'))

const profiles = buildAllProfiles(cards, skillData, skillNames, growthConditions)

fs.writeFileSync(
  path.join(dataDir, 'uma_profiles.json'),
  JSON.stringify(profiles, null, 2) + '\n'
)

console.log(`Wrote ${profiles.length} profiles.`)
