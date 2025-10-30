// Lightweight Firebase helper using dynamic import so project can still run without firebase installed.
// To enable: run `npm install firebase` and create `src/firebaseConfig.js` that exports the firebase config object as default.

let _app = null
let _db = null
let _helpers = null

async function ensureInit() {
  if (_db) return { app: _app, db: _db, helpers: _helpers }
  let config = null
  try {
    // try to load user-provided config file
    // Note: this file is NOT added by default; user must create it with their Firebase project's config
    // Example `src/firebaseConfig.js`: export default { apiKey: '...', authDomain: '...'}
    // We import it dynamically so bundlers don't fail when file is missing
    // Try common locations for the config file in a way Vite/Rollup can analyze.
    // Use import.meta.glob to optionally load `./firebaseConfig.js` or `./firebase/firebaseConfig.js`.
    // This avoids dynamic import string concatenation which triggers Vite warnings.
    try {
      // import.meta.glob returns an object mapping matching paths to modules (when eager:true)
      const cfgCandidates = import.meta.glob('./firebaseConfig.js', { eager: true })
      for (const p in cfgCandidates) {
        const mod = cfgCandidates[p]
        if (mod) {
          if (mod.default && typeof mod.default === 'object') { config = mod.default; break }
          else if (typeof mod === 'object' && (mod.apiKey || mod.projectId)) { config = mod; break }
        }
      }

      if (!config) {
        const cfgCandidates2 = import.meta.glob('./firebase/firebaseConfig.js', { eager: true })
        for (const p in cfgCandidates2) {
          const mod2 = cfgCandidates2[p]
          if (mod2) {
            if (mod2.default && typeof mod2.default === 'object') { config = mod2.default; break }
            else if (typeof mod2 === 'object' && (mod2.apiKey || mod2.projectId)) { config = mod2; break }
          }
        }
      }
    } catch (e) {
      // ignore — config not provided in known locations
    }

    const firebaseAppModule = await import('firebase/app')
    const firestoreModule = await import('firebase/firestore')
    const { initializeApp, getApps } = firebaseAppModule
  const { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp, setDoc, getDocs, query, where } = firestoreModule

    // If we don't have a config object, check whether an app was already initialized
    if (!config) {
      // If a firebase initialization script already ran (e.g. src/firebase/firebaseConfig.js that calls initializeApp),
      // getApps() will return the initialized app(s). Use the first one.
      try {
        const apps = getApps()
        if (apps && apps.length > 0) {
          _app = apps[0]
        }
      } catch (e) {
        // ignore
      }
    }

    if (!config && !_app) {
      throw new Error('Firebase config not found. Create src/firebaseConfig.js exporting the config object, or initialize Firebase before importing helpers.')
    }

    if (!_app) {
      // initialize with provided config
      window.__FB_APP__ = initializeApp(config)
      _app = window.__FB_APP__
    } else {
      // ensure global reference for consistency
      window.__FB_APP__ = _app
    }

    if (!window.__FB_DB__) {
      window.__FB_DB__ = getFirestore(window.__FB_APP__)
    }
    _db = window.__FB_DB__
    // Cache helpers so subsequent calls to ensureInit return them (avoids undefined helpers)
  _helpers = { collection, addDoc, doc, getDoc, serverTimestamp, setDoc, getDocs, query, where }
    window.__FB_HELPERS__ = _helpers
    return { app: _app, db: _db, helpers: _helpers }
  } catch (e) {
    throw new Error('Firebase initialization failed: ' + (e && e.message ? e.message : e))
  }
}

export { ensureInit }

export async function uploadProblemSet(obj, docId = null) {
  // obj: { type: 'problemSet', name, items }
  // If docId is provided, overwrite that document. Otherwise, try to find an existing
  // document with the same payload.name and overwrite it. If none found, create a new doc.
  try {
    const { db, helpers } = await ensureInit()
    const colRef = helpers.collection(db, 'sharedProblemSets')
    const data = { payload: obj, createdAt: helpers.serverTimestamp() }

    if (docId) {
      const dref = helpers.doc(db, 'sharedProblemSets', docId)
      await helpers.setDoc(dref, data)
      return docId
    }

    // Try to find existing by name (if provided)
    if (obj && obj.name) {
      try {
        const q = helpers.query(colRef, helpers.where('payload.name', '==', obj.name))
        const snaps = await helpers.getDocs(q)
        if (!snaps.empty) {
          const existingId = snaps.docs[0].id
          const dref = helpers.doc(db, 'sharedProblemSets', existingId)
          await helpers.setDoc(dref, data)
          return existingId
        }
      } catch (e) {
        // ignore query errors and fall back to creating a new doc
        console.warn('uploadProblemSet: query failed, will create new doc', e)
      }
    }

    const ref = await helpers.addDoc(colRef, data)
    return ref.id
  } catch (e) {
    throw e
  }
}

export async function downloadProblemSet(id) {
  try {
    const { db, helpers } = await ensureInit()
    const dref = helpers.doc(db, 'sharedProblemSets', id)
    const snap = await helpers.getDoc(dref)
    if (!snap.exists()) return null
    return snap.data().payload
  } catch (e) {
    throw e
  }
}

export async function uploadGroup(obj, docId = null) {
  // If docId provided, overwrite. Otherwise try to find by name and overwrite; else create.
  try {
    const { db, helpers } = await ensureInit()
    const colRef = helpers.collection(db, 'sharedGroups')
    const data = { payload: obj, createdAt: helpers.serverTimestamp() }

    if (docId) {
      const dref = helpers.doc(db, 'sharedGroups', docId)
      await helpers.setDoc(dref, data)
      return docId
    }

    if (obj && obj.name) {
      try {
        const q = helpers.query(colRef, helpers.where('payload.name', '==', obj.name))
        const snaps = await helpers.getDocs(q)
        if (!snaps.empty) {
          const existingId = snaps.docs[0].id
          const dref = helpers.doc(db, 'sharedGroups', existingId)
          await helpers.setDoc(dref, data)
          return existingId
        }
      } catch (e) {
        console.warn('uploadGroup: query failed, will create new doc', e)
      }
    }

    const ref = await helpers.addDoc(colRef, data)
    return ref.id
  } catch (e) {
    throw e
  }
}

export async function downloadGroup(id) {
  try {
    const { db, helpers } = await ensureInit()
    const dref = helpers.doc(db, 'sharedGroups', id)
    const snap = await helpers.getDoc(dref)
    if (!snap.exists()) return null
    return snap.data().payload
  } catch (e) {
    throw e
  }
}

/* Usage notes (add to project README):

1) Install SDK:
   npm install firebase

2) Create `src/firebaseConfig.js` with your Firebase web config, for example:
   export default {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     // ... etc
   }

3) Call these helpers from UI components. They will throw if firebase is not configured.

Security: currently this stores shared payloads in Firestore without access control. If you deploy publicly, consider security rules to limit writes or add an admin key.
*/
