// iconUrl.js
//
// Gametora stores character stand/thumb images keyed by their card id, e.g.
// Air Groove's card id is 101801 -> chara_stand_1018_101801.png (the prefix
// is just the first 4 digits of the id). Our card_id values match this id
// scheme directly, so no separate id-mapping table is needed.
export function getIconUrl(cardId) {
  if (!cardId) return null
  const id = String(cardId)
  const prefix = id.slice(0, 4)
  return `https://gametora.com/images/umamusume/characters/thumb/chara_stand_${prefix}_${id}.png`
}
