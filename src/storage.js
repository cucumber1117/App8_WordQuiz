const KEY = 'wordquiz:data'

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function defaultData() {
  return {
    groups: [{ id: 'g_default', name: 'Default' }],
    words: [], // {id, groupId, word, meaning}
    wrongs: [], // array of wordId
    problemSets: [], // {id, name, wordIds: []}
  }
}

export function getData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const d = defaultData()
      localStorage.setItem(KEY, JSON.stringify(d))
      return d
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error('storage getData error', e)
    const d = defaultData()
    localStorage.setItem(KEY, JSON.stringify(d))
    return d
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function addGroup(name) {
  const d = getData()
  d.groups.push({ id: uid('g_'), name })
  saveData(d)
}

export function addWord({ groupId, word, meaning }) {
  const d = getData()
  d.words.push({ id: uid('w_'), groupId, word, meaning })
  saveData(d)
}

export function getWordsByGroup(groupId) {
  const d = getData()
  return d.words.filter((w) => w.groupId === groupId)
}

export function deleteWord(wordId) {
  const d = getData()
  d.words = d.words.filter((w) => w.id !== wordId)
  // also remove from wrongs
  d.wrongs = d.wrongs.filter((id) => id !== wordId)
  saveData(d)
}

export function recordWrong(wordId) {
  const d = getData()
  if (!d.wrongs.includes(wordId)) d.wrongs.push(wordId)
  saveData(d)
}

export function getWrongList() {
  const d = getData()
  return d.wrongs
    .map((id) => d.words.find((w) => w.id === id))
    .filter(Boolean)
}

export function clearWrongList() {
  const d = getData()
  d.wrongs = []
  saveData(d)
}

export function removeWrong(wordId) {
  const d = getData()
  d.wrongs = d.wrongs.filter((id) => id !== wordId)
  saveData(d)
}

// ===== problemSets =====
export function getProblemSets() {
  const d = getData()
  return d.problemSets || []
}

export function addProblemSet(name, wordIds = []) {
  const d = getData()
  d.problemSets = d.problemSets || []
  d.problemSets.push({ id: uid('p_'), name, wordIds })
  saveData(d)
}

export function deleteProblemSet(id) {
  const d = getData()
  d.problemSets = (d.problemSets || []).filter((ps) => ps.id !== id)
  saveData(d)
}

export function getProblemSetWords(problemSetId) {
  const d = getData()
  const ps = (d.problemSets || []).find((p) => p.id === problemSetId)
  if (!ps) return []
  return ps.wordIds.map((id) => d.words.find((w) => w.id === id)).filter(Boolean)
}

// Add support for custom QA items in a problem set (backward-compatible)
export function addProblemSetWithItems(name, items = []) {
  // items: [{question, answer}]
  const d = getData()
  d.problemSets = d.problemSets || []
  const ps = { id: uid('p_'), name, items: items.map(it => ({ id: uid('pi_'), question: it.question, answer: it.answer })) }
  d.problemSets.push(ps)
  saveData(d)
}

export function getProblemSetItems(problemSetId) {
  const d = getData()
  const ps = (d.problemSets || []).find((p) => p.id === problemSetId)
  if (!ps) return []
  // if stored as wordIds, convert to word-based items
  if (ps.items) return ps.items
  if (ps.wordIds) {
    return ps.wordIds.map((id) => {
      const w = d.words.find((x) => x.id === id)
      return w ? { id: id, question: w.word, answer: w.meaning } : null
    }).filter(Boolean)
  }
  return []
}

export function addProblemToSet(problemSetId, item) {
  // item: { type: 'choice'|'word', question, answer, choices? }
  const d = getData()
  const ps = (d.problemSets || []).find((p) => p.id === problemSetId)
  if (!ps) return false
  ps.items = ps.items || []
  ps.items.push({ id: uid('pi_'), ...item })
  saveData(d)
  return true
}

export function removeProblemFromSet(problemSetId, itemIndex) {
  const d = getData()
  const ps = (d.problemSets || []).find((p) => p.id === problemSetId)
  if (!ps || !ps.items) return false
  if (itemIndex < 0 || itemIndex >= ps.items.length) return false
  ps.items.splice(itemIndex, 1)
  saveData(d)
  return true
}

// update an existing problem item (replace at index)
export function updateProblemInSet(problemSetId, itemIndex, newItem) {
  const d = getData()
  const ps = (d.problemSets || []).find((p) => p.id === problemSetId)
  if (!ps || !ps.items) return false
  if (itemIndex < 0 || itemIndex >= ps.items.length) return false
  // preserve existing id if present
  const existing = ps.items[itemIndex]
  ps.items[itemIndex] = { id: existing?.id || uid('pi_'), ...newItem }
  saveData(d)
  return true
}

// ===== recent usage and pending selection helpers =====
export function touchGroup(groupId) {
  const d = getData()
  const g = (d.groups || []).find((x) => x.id === groupId)
  if (!g) return false
  g.lastUsed = Date.now()
  saveData(d)
  return true
}

export function touchProblemSet(problemSetId) {
  const d = getData()
  const p = (d.problemSets || []).find((x) => x.id === problemSetId)
  if (!p) return false
  p.lastUsed = Date.now()
  saveData(d)
  return true
}

export function getRecentGroups(limit = 5) {
  const d = getData()
  return (d.groups || []).slice().sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)).slice(0, limit)
}

export function getRecentProblemSets(limit = 5) {
  const d = getData()
  return (d.problemSets || []).slice().sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)).slice(0, limit)
}

// pending selection used to jump from Home -> QuizPage with preselected id
const PENDING_KEY = 'wordquiz:pending'
export function savePendingSelection(type, id) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ type, id }))
  } catch (e) {}
}
export function getPendingSelection() {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) { return null }
}
export function clearPendingSelection() { try { localStorage.removeItem(PENDING_KEY) } catch (e) {} }

// ===== export / import helpers =====
export function exportGroup(groupId) {
  const d = getData()
  const g = (d.groups || []).find((x) => x.id === groupId)
  if (!g) return null
  const words = d.words.filter((w) => w.groupId === groupId).map((w) => ({ word: w.word, meaning: w.meaning }))
  return { type: 'group', name: g.name, words }
}

export function importGroup(obj) {
  // obj: { type: 'group', name, words: [{word, meaning}] }
  if (!obj || obj.type !== 'group' || !obj.name) return null
  const d = getData()
  const newId = uid('g_')
  d.groups.push({ id: newId, name: obj.name })
  (obj.words || []).forEach((w) => {
    d.words.push({ id: uid('w_'), groupId: newId, word: w.word || '', meaning: w.meaning || '' })
  })
  saveData(d)
  return newId
}

export function exportProblemSet(problemSetId) {
  const d = getData()
  const ps = (d.problemSets || []).find((p) => p.id === problemSetId)
  if (!ps) return null
  // copy items but omit internal ids
  const items = (ps.items || []).map((it) => {
    const copy = { ...it }
    delete copy.id
    return copy
  })
  return { type: 'problemSet', name: ps.name, items }
}

export function importProblemSet(obj) {
  // obj: { type: 'problemSet', name, items: [...] }
  if (!obj || obj.type !== 'problemSet' || !obj.name) return null
  const d = getData()
  d.problemSets = d.problemSets || []
  const newPs = { id: uid('p_'), name: obj.name, items: (obj.items || []).map((it) => ({ id: uid('pi_'), ...it })) }
  d.problemSets.push(newPs)
  saveData(d)
  return newPs.id
}

// ===== Firebase sync helpers =====
// These functions attempt to use the firebaseHelper (which will throw if firebase is not configured).
export async function pushAllToFirebase() {
  try {
    const fh = await import('./firebaseHelper')
    const { ensureInit } = fh
    const { db, helpers } = await ensureInit()
    // store the full local dataset at a fixed doc id 'global'
    const d = getData()
    const ref = helpers.doc(db, 'appData', 'global')
    await helpers.setDoc(ref, { payload: d, updatedAt: helpers.serverTimestamp() })
    return true
  } catch (e) {
    throw new Error('pushAllToFirebase failed: ' + (e && e.message ? e.message : e))
  }
}

export async function pullAllFromFirebase() {
  try {
    const fh = await import('./firebaseHelper')
    const { ensureInit } = fh
    const { db, helpers } = await ensureInit()
    const ref = helpers.doc(db, 'appData', 'global')
    const snap = await helpers.getDoc(ref)
    if (!snap.exists()) return null
    const payload = snap.data().payload
    if (!payload) return null
    saveData(payload)
    return payload
  } catch (e) {
    throw new Error('pullAllFromFirebase failed: ' + (e && e.message ? e.message : e))
  }
}
