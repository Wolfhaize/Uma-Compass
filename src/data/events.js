// Parsed from "Another Umamusume Timeline - CM & LoH.pdf"
// scenario = the game scenario active when the event's initial registration period started
// type = "CM" (Champions Meeting), "LoH" (League of Heroes), or "MM" (Monthly Match)

const E = (no, type, name, jpDate, enDate, track, terrain, distance, category, direction, season, weather, condition, scenario, note) => ({
  no, type, name, jpDate, enDate, track, terrain, distance, category, direction, season, weather, condition, scenario, note,
})

export const EVENTS = [
  E('CM 11', 'CM', 'Pisces Cup', '3/22/2022', '3/26/2026', 'Hanshin', 'Turf', 3200, 'Long', 'Right', 'Spring', 'Rain', 'Heavy', 'Trackblazer'),
  E('CM 12', 'CM', 'Aries Cup', '4/22/2022', '4/20/2026', 'Nakayama', 'Turf', 2000, 'Medium', 'Right', 'Spring', 'Clear', 'Firm', 'Trackblazer'),
  E('CM 13', 'CM', 'Taurus Cup', '5/24/2022', '5/10/2026', 'Tokyo', 'Turf', 2400, 'Medium', 'Left', 'Spring', 'Clear', 'Firm', 'Trackblazer', 'Rank cap increase for Open League (B >> A+)'),
  E('CM 14', 'CM', 'Gemini Cup', '6/14/2022', '5/31/2026', 'Tokyo', 'Turf', 1600, 'Mile', 'Left', 'Spring', 'Clear', 'Firm', 'Trackblazer'),
  E('CM 15', 'CM', 'Cancer Cup', '7/14/2022', '6/21/2026', 'Hanshin', 'Turf', 2200, 'Medium', 'Right', 'Summer', 'Cloudy', 'Good', 'Trackblazer'),
  E('CM 16', 'CM', 'Leo Cup', '8/13/2022', '7/12/2026', 'Nakayama', 'Turf', 1200, 'Sprint', 'Right', 'Summer', 'Clear', 'Firm', 'Trackblazer'),

  E('CM 17', 'CM', 'Virgo Cup', '9/15/2022', '8/4/2026', 'Oi', 'Dirt', 2000, 'Medium', 'Right', 'Fall', 'Clear', 'Good', 'Grand Live'),
  E('CM 18', 'CM', 'Libra Cup', '10/14/2022', '8/24/2026', 'Hanshin', 'Turf', 1600, 'Mile', 'Right', 'Fall', 'Cloudy', 'Firm', 'Grand Live'),
  E('CM 19', 'CM', 'Scorpio Cup', '11/13/2022', '9/14/2026', 'Kyoto', 'Turf', 2200, 'Medium', 'Right', 'Fall', 'Clear', 'Firm', 'Grand Live'),
  E('CM 20', 'CM', 'Sagittarius Cup', '12/15/2022', '10/7/2026', 'Nakayama', 'Turf', 2500, 'Long', 'Right', 'Winter', 'Cloudy', 'Good', 'Grand Live', 'Matchmaking completed for all 5 matches at once; "View Results" button added'),
  E('CM 21', 'CM', 'Capricorn Cup', '1/14/2023', '10/28/2026', 'Chukyo', 'Turf', 1200, 'Sprint', 'Left', 'Winter', 'Clear', 'Firm', 'Grand Live'),
  E('CM 22', 'CM', 'Aquarius Cup', '2/17/2023', '11/21/2026', 'Tokyo', 'Dirt', 1600, 'Mile', 'Left', 'Winter', 'Snow', 'Soft', 'Grand Live'),

  E('CM 23', 'CM', 'Pisces Cup', '3/14/2023', '12/8/2026', 'Nakayama', 'Turf', 2000, 'Medium', 'Right', 'Spring', 'Clear', 'Firm', 'Grand Masters'),
  E('CM 24', 'CM', 'Aries Cup', '4/13/2023', '12/29/2026', 'Kyoto', 'Turf', 3200, 'Long', 'Right', 'Spring', 'Clear', 'Firm', 'Grand Masters'),
  E('LoH 1', 'LoH', '---', '5/12/2023', '1/18/2027', 'Tokyo', 'Turf', 2400, 'Medium', 'Left', 'Spring', '---', '---', 'Grand Masters'),
  E('CM 25', 'CM', 'Mile', '6/13/2023', '2/10/2027', 'Tokyo', 'Turf', 1600, 'Mile', 'Left', 'Spring', 'Rain', 'Heavy', 'Grand Masters'),
  E('LoH 2', 'LoH', '---', '7/13/2023', '3/3/2027', 'Nakayama', 'Turf', 1200, 'Sprint', 'Right', 'Summer', '---', '---', 'Grand Masters'),
  E('CM 26', 'CM', 'Dirt', '8/18/2023', '3/28/2027', 'Funabashi', 'Dirt', 1600, 'Mile', 'Left', 'Summer', 'Clear', 'Firm', 'Grand Masters'),

  E('LoH 3', 'LoH', '---', '9/13/2023', '4/15/2027', 'Kyoto', 'Turf', 3000, 'Long', 'Right', 'Fall', '---', '---', "Project L'Arc"),
  E('CM 27', 'CM', 'Classic', '10/13/2023', '5/6/2027', 'Longchamp', 'Turf', 2400, 'Medium', 'Right', 'Fall', 'Rain', 'Soft', "Project L'Arc"),
  E('LoH 4', 'LoH', '---', '11/12/2023', '5/27/2027', 'Kyoto', 'Turf', 1600, 'Mile', 'Right', 'Fall', '---', '---', "Project L'Arc"),
  E('CM 28', 'CM', 'Long', '12/14/2023', '6/19/2027', 'Nakayama', 'Turf', 2500, 'Long', 'Right', 'Winter', 'Snow', 'Soft', "Project L'Arc"),
  E('LoH 5', 'LoH', '---', '1/12/2024', '7/9/2027', 'Kawasaki', 'Dirt', 2100, 'Medium', 'Left', 'Winter', '---', '---', "Project L'Arc"),
  E('CM 29', 'CM', 'Sprint', '2/18/2024', '8/4/2027', 'Hanshin', 'Turf', 1400, 'Sprint', 'Right', 'Winter', 'Cloudy', 'Good', "Project L'Arc"),

  E('MM', 'MM', '---', '3/4/2024', '8/14/2027', '---', '---', null, '---', '---', '---', '---', '---', 'U.A.F'),
  E('CM 30', 'CM', 'Mile', '4/13/2024', '9/11/2027', 'Hanshin', 'Turf', 1600, 'Mile', 'Right', 'Spring', 'Clear', 'Firm', 'U.A.F'),
  E('LoH 6', 'LoH', '---', '5/14/2024', '10/3/2027', 'Kyoto', 'Turf', 3200, 'Long', 'Right', 'Spring', '---', '---', 'U.A.F'),
  E('CM 31', 'CM', 'Classic', '6/20/2024', '10/29/2027', 'Tokyo', 'Turf', 2400, 'Medium', 'Left', 'Spring', 'Cloudy', 'Soft', 'U.A.F'),

  E('LoH 7', 'LoH', '---', '7/22/2024', '11/20/2027', 'Niigata', 'Turf', 1000, 'Sprint', 'Left', 'Summer', '---', '---', 'Great Food Festival'),
  E('CM 32', 'CM', 'Dirt', '8/25/2024', '12/14/2027', 'Chukyo', 'Dirt', 1800, 'Mile', 'Left', 'Summer', 'Clear', 'Firm', 'Great Food Festival'),

  E('LoH 8', 'LoH', '---', '9/23/2024', '1/3/2028', 'Kyoto', 'Turf', 1600, 'Mile', 'Right', 'Fall', '---', '---', 'Run, Mecha Umamusume!'),
  E('CM 33', 'CM', 'Classic', '10/23/2024', '1/24/2028', 'Tokyo', 'Turf', 2000, 'Medium', 'Left', 'Fall', 'Clear', 'Firm', 'Run, Mecha Umamusume!'),
  E('LoH 9', 'LoH', '---', '11/21/2024', '2/14/2028', 'Kyoto', 'Turf', 2200, 'Medium', 'Right', 'Fall', '---', '---', 'Run, Mecha Umamusume!'),
  E('CM 34', 'CM', 'Long', '12/22/2024', '3/6/2028', 'Nakayama', 'Turf', 2500, 'Long', 'Right', 'Winter', 'Cloudy', 'Good', 'Run, Mecha Umamusume!', 'Rank cap increase for Open League (A+ >> UE1)'),
  E('CM 35', 'CM', 'Classic', '1/24/2025', '3/30/2028', 'Hanshin', 'Turf', 2400, 'Medium', 'Right', 'Winter', 'Rain', 'Soft', 'Run, Mecha Umamusume!'),
  E('LoH 10', 'LoH', '---', '2/16/2025', '4/15/2028', 'Nakayama', 'Turf', 1200, 'Sprint', 'Right', 'Winter', '---', '---', 'Run, Mecha Umamusume!'),

  E('CM 36', 'CM', 'Mile', '3/25/2025', '5/11/2028', 'Hanshin', 'Turf', 1600, 'Mile', 'Right', 'Spring', 'Clear', 'Firm', 'Twinkle Legends'),
  E('CM 37', 'CM', 'Long', '4/23/2025', '5/31/2028', 'Kyoto', 'Turf', 3200, 'Long', 'Right', 'Spring', 'Clear', 'Firm', 'Twinkle Legends'),
  E('LoH 11', 'LoH', '---', '5/24/2025', '6/22/2028', 'Oi', 'Dirt', 2000, 'Medium', 'Right', 'Spring', '---', '---', 'Twinkle Legends'),
  E('CM 38', 'CM', 'Classic', '6/21/2025', '7/11/2028', 'Tokyo', 'Turf', 2400, 'Medium', 'Left', 'Spring', 'Clear', 'Firm', 'Twinkle Legends'),

  E('CM 39*', 'CM', 'Classic', '7/25/2025', '8/4/2028', 'Hanshin', 'Turf', 2200, 'Medium', 'Right', 'Summer', 'Cloudy', 'Good', 'Design Your Island', 'Debuffs banned in this event'),
  E('LoH 12', 'LoH', '---', '8/15/2025', '8/19/2028', 'Sapporo', 'Turf', 2600, 'Long', 'Right', 'Summer', '---', '---', 'Design Your Island'),
  E('CM 40', 'CM', 'Classic', '9/22/2025', '9/14/2028', 'Kyoto', 'Turf', 2000, 'Medium', 'Right', 'Fall', 'Clear', 'Firm', 'Design Your Island'),
  E('CM 41', 'CM', 'Sprint', '10/23/2025', '10/6/2028', 'Niigata', 'Turf', 1200, 'Sprint', 'Left', 'Fall', 'Cloudy', 'Firm', 'Design Your Island'),

  E('LoH 13', 'LoH', '---', '11/21/2025', '10/26/2028', 'Morioka', 'Dirt', 1600, 'Mile', 'Left', 'Fall', '---', '---', 'Yukoma Hot Springs'),
  E('CM 42*', 'CM', 'Mile', '12/21/2025', '11/16/2028', 'Hanshin', 'Turf', 1600, 'Mile', 'Right', 'Winter', 'Clear', 'Firm', 'Yukoma Hot Springs', 'Rank cap increase for Open League (UE1 >> UC); debuffs banned'),
  E('CM 43', 'CM', 'Long', '1/22/2026', '12/9/2028', 'Nakayama', 'Turf', 2500, 'Long', 'Right', 'Winter', 'Clear', 'Firm', 'Yukoma Hot Springs'),
  E('LoH 14', 'LoH', '---', '2/15/2026', '12/25/2028', 'Tokyo', 'Turf', 1600, 'Mile', 'Left', 'Winter', '---', '---', 'Yukoma Hot Springs'),

  E('CM 44', 'CM', 'Classic', '3/22/2026', '1/19/2029', 'Del Mar', 'Turf', 2200, 'Medium', 'Left', 'Spring', 'Clear', 'Firm', 'Beyond Dreams'),
  E('CM 45', 'CM', 'Dirt', '4/23/2026', '2/10/2029', 'Del Mar', 'Dirt', 2000, 'Medium', 'Left', 'Spring', 'Clear', 'Firm', 'Beyond Dreams'),
  E('LoH 15', 'LoH', '---', '5/22/2026', '3/3/2029', 'Kyoto', 'Turf', 1200, 'Sprint', 'Right', 'Spring', '---', '---', 'Beyond Dreams'),
  E('CM 46*', 'CM', 'Classic', '6/23/2026', '3/25/2029', 'Tokyo', 'Turf', 2400, 'Medium', 'Left', 'Spring', 'Cloudy', 'Heavy', 'Beyond Dreams', 'Debuffs banned in this event'),

  E('CM 47*', 'CM', 'Long', '7/24/2026', '4/16/2029', 'Nakayama', 'Turf', 3600, 'Long', 'Right', 'Summer', 'Clear', 'Good', 'Ramen!', 'Debuffs banned in this event'),
  E('LoH 16', 'LoH', '---', '~Aug 2026', null, 'Nakayama', 'Turf', 2000, 'Medium', 'Right', 'Summer', '---', '---', 'Ramen!'),
  E('CM 48', 'CM', 'Mile', '~Sep 2026', null, 'Tokyo', 'Turf', 1800, 'Mile', 'Left', 'Fall', 'Clear', 'Good', 'Ramen!'),
  E('CM 49', 'CM', 'Classic', '~Oct 2026', null, '?', 'Turf', null, 'Medium', '?', '?', '?', '?', 'Scenario 15'),
  E('LoH 17', 'LoH', 'Long', '~Nov 2026', null, '?', 'Turf', null, 'Long', '?', '?', '---', '---', 'Scenario 15'),
  E('CM 50', 'CM', 'Long', '~Dec 2026', null, '?', 'Turf', null, 'Long', '?', '?', '?', '?', 'Scenario 15'),
  E('?', '?', '?', '~Jan 2027', null, '?', '?', null, '?', '?', '?', '?', '?', 'Scenario 15'),
  E('?', '?', '?', '~Feb 2027', null, '?', '?', null, '?', '?', '?', '?', '?', 'Scenario 15'),
]

export const SCENARIOS = [...new Set(EVENTS.map(e => e.scenario))]
export const EVENT_TYPES = [...new Set(EVENTS.map(e => e.type))]
export const TERRAINS = [...new Set(EVENTS.map(e => e.terrain))].filter(Boolean)
export const CATEGORIES = [...new Set(EVENTS.map(e => e.category))].filter(Boolean)
