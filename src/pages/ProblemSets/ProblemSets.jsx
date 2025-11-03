import { useState } from 'react'
import * as storage from '../../storage'
import './ProblemSets.css'

export default function ProblemSets({ onOpen }) {
  const [tick, setTick] = useState(0)
  const sets = storage.getProblemSets()
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const items = selectedId ? storage.getProblemSetItems(selectedId) : []
  const [pageIndex, setPageIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const filteredSets = sets.filter(s => s.name.toLowerCase().includes(query.trim().toLowerCase()))
  const [importMode, setImportMode] = useState('json') // 'json' | 'firestore'
  const [importJsonText, setImportJsonText] = useState('')
  const [fsType, setFsType] = useState('problemSet')
  const [fsDocId, setFsDocId] = useState('')
  const [loadingImport, setLoadingImport] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const openAsBook = (id) => {
    setSelectedId(id)
    setPageIndex(0)
    setShowAnswer(false)
  }

  const next = () => {
    if (pageIndex < items.length - 1) {
      setPageIndex(pageIndex + 1)
      setShowAnswer(false)
    }
  }
  const prev = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1)
      setShowAnswer(false)
    }
  }

  return (
    <div className="problemsets-page layout">
      <div className="listPanel">
        <h3>問題集一覧</h3>
        <div className="searchBox">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="問題集を検索" />
        </div>
        {/* If a book is opened (selectedId), hide import and list to avoid distraction */}
        {!selectedId ? (
          <>
            {!showImport ? (
              <div style={{ padding: 12 }}>
                <button className="btn" onClick={() => setShowImport(true)}>＋ 問題集の追加</button>
              </div>
            ) : (
              <div className="importArea">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>インポート</label>
                  <button className="btn" onClick={() => setShowImport(false)}>閉じる</button>
                </div>
                <div className="importTabs">
                  <button className={`importTab ${importMode === 'json' ? 'active' : ''}`} onClick={() => setImportMode('json')}>JSON を貼り付け</button>
                  <button className={`importTab ${importMode === 'firestore' ? 'active' : ''}`} onClick={() => setImportMode('firestore')}>Firestore から ID で取り込む</button>
                </div>

                {importMode === 'json' && (
                  <div className="importContent">
                    <textarea value={importJsonText} onChange={(e) => setImportJsonText(e.target.value)} placeholder='ここに共有された JSON を貼り付けて「インポート」を押してください' style={{ width: '100%', minHeight: 100 }} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button className="btn" disabled={loadingImport} onClick={() => {
                        if (!importJsonText.trim()) return alert('JSON を貼り付けてください')
                        try {
                          const obj = JSON.parse(importJsonText)
                          if (obj.type === 'problemSet') {
                            const id = storage.importProblemSet(obj)
                            alert('問題集をインポートしました')
                            setSelectedId(id)
                            setShowImport(false)
                          } else if (obj.type === 'group') {
                            const id = storage.importGroup(obj)
                            alert('グループをインポートしました')
                            setSelectedId(null)
                            setShowImport(false)
                          } else {
                            alert('サポートされていない JSON 形式です')
                          }
                        } catch (e) {
                          alert('JSON の解析に失敗しました')
                        }
                      }}>{loadingImport ? 'インポート中…' : 'インポート'}</button>
                      <button className="btn" onClick={() => { navigator.clipboard.readText().then(t => setImportJsonText(t)).catch(()=>alert('クリップボードの読み取りに失敗しました')) }}>クリップボードから貼り付け</button>
                    </div>
                  </div>
                )}

                {importMode === 'firestore' && (
                  <div className="importContent">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={fsType} onChange={(e) => setFsType(e.target.value)} style={{ padding: 8 }}>
                        <option value="problemSet">problemSet</option>
                        <option value="group">group</option>
                      </select>
                      <input value={fsDocId} onChange={(e) => setFsDocId(e.target.value)} placeholder="ドキュメント ID を入力" style={{ flex: 1, padding: 8 }} />
                      <button className="btn" disabled={loadingImport} onClick={async () => {
                        const id = fsDocId.trim()
                        if (!id) return alert('ドキュメント ID を入力してください')
                        setLoadingImport(true)
                        try {
                          const fh = await import('../../firebaseHelper')
                          if (fsType === 'problemSet') {
                            const payload = await fh.downloadProblemSet(id)
                            if (!payload) return alert('指定のドキュメントが見つかりませんでした')
                            const maybe = payload.payload || payload
                            if (maybe.type === 'problemSet' || maybe.items) {
                              const newId = storage.importProblemSet(maybe)
                              alert('問題集をインポートしました（id: ' + newId + '）')
                              setSelectedId(newId)
                              setShowImport(false)
                            } else {
                              alert('取得したデータが問題集フォーマットではありません')
                            }
                          } else {
                            const payload = await fh.downloadGroup(id)
                            if (!payload) return alert('指定のドキュメントが見つかりませんでした')
                            const newId = storage.importGroup(payload)
                            alert('グループをインポートしました（id: ' + newId + '）')
                            setShowImport(false)
                          }
                        } catch (err) {
                          console.error('Firestore import error', err)
                          alert('Firestore からの取り込みに失敗しました: ' + (err?.message || String(err)))
                        } finally {
                          setLoadingImport(false)
                        }
                      }}>{loadingImport ? '取り込み中…' : 'Firestore からインポート'}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 12 }}>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{sets.find(s => s.id === selectedId)?.name || '—'}</div>
            <div style={{ marginTop: 6, color: '#666' }}>{(items || []).length} 問</div>
          </div>
        )}
        {!selectedId && filteredSets.length === 0 && <p>該当する問題集がありません。</p>}
        {!selectedId && (
          <ul className="setsList">
            {filteredSets.map(s => (
              <li key={s.id} className="setRow">
                <div>
                  <strong>{s.name}</strong>
                  <div className="meta">{(s.items || s.wordIds || []).length} 問</div>
                </div>
                <div className="actions">
                  <div className="primary-actions">
                    <button className="btn" onClick={() => openAsBook(s.id)}>本で開く</button>
                    <button className="btn" onClick={() => { storage.savePendingSelection('problem', s.id); if (onOpen) onOpen('problem') }}>問題を追加</button>
                    <button className="btn" onClick={() => { storage.savePendingSelection('problem', s.id); if (onOpen) onOpen('quiz') }}>クイズで使う</button>
                  </div>
                  <div className="secondary-actions">
                    <button className="btn" onClick={async () => {
                      const data = storage.exportProblemSet(s.id)
                      if (!data) return alert('エクスポートできません')
                      const text = JSON.stringify(data)
                      try {
                        await navigator.clipboard.writeText(text)
                        alert('問題集の JSON をクリップボードにコピーしました')
                      } catch (e) {
                        prompt('以下をコピーして共有してください', text)
                      }
                    }}>共有</button>

                    <button className="btn" onClick={async () => {
                      try {
                        const data = storage.exportProblemSet(s.id)
                        const id = await (await import('../../firebaseHelper')).uploadProblemSet(data)
                        const url = window.location.origin + window.location.pathname + `?shared_ps=${id}`
                        // persist shared id to local problem set so others' uploads can be tracked
                        try {
                          const d = storage.getData()
                          const ps = (d.problemSets || []).find(p => p.id === s.id)
                          if (ps) {
                            ps.sharedDocId = id
                            storage.saveData(d)
                          }
                        } catch (e) {
                          console.warn('failed to save sharedDocId locally', e)
                        }
                        try { await navigator.clipboard.writeText(url); alert('共有URLをコピーしました: ' + url) } catch { prompt('共有URL', url) }
                      } catch (err) {
                        console.error('uploadProblemSet error', err)
                        alert('Firebase へのアップロードに失敗しました: ' + (err?.message || String(err)))
                      }
                    }}>アップロード</button>

                    <button className="btn" onClick={async () => {
                      // Firestore 側の問題集を取得し、ローカルとマージする（ローカルで追加した問題は残す）
                      const localData = storage.getData()
                      const localPs = (localData.problemSets || []).find(x => x.id === s.id)
                      let docId = localPs?.sharedDocId
                      setLoadingImport(true)
                      try {
                        const fh = await import('../../firebaseHelper')
                        if (!docId && localPs && localPs.name) {
                          try {
                            const { db, helpers } = await fh.ensureInit()
                            const colRef = helpers.collection(db, 'sharedProblemSets')
                            const q = helpers.query(colRef, helpers.where('payload.name', '==', localPs.name))
                            const snaps = await helpers.getDocs(q)
                            if (!snaps.empty) docId = snaps.docs[0].id
                          } catch (e) {
                            console.warn('query failed', e)
                          }
                        }

                        if (!docId) {
                          docId = prompt('Firestore のドキュメント ID を入力してください（upload 時に得た id）')
                          if (!docId) return
                        }

                        const payload = await fh.downloadProblemSet(docId)
                        if (!payload) return alert('指定のドキュメントが見つかりませんでした')
                        const maybe = payload.payload || payload
                        const remote = maybe.type === 'problemSet' ? maybe : (maybe.items ? maybe : null)
                        if (!remote) return alert('取得したデータが問題集フォーマットではありません')

                        const d = storage.getData()
                        const local = (d.problemSets || []).find(x => x.id === s.id)
                        if (!local) return alert('ローカルの問題集が見つかりません')

                        const remoteItems = remote.items || []
                        local.name = remote.name || local.name

                        // normalize key function (same rules as 取り込む) for duplicate detection
                        const normalizeKey = (it) => {
                          const type = (it.type || 'word')
                          if (type === 'choice') {
                            const question = (it.question || '').toString().trim()
                            const choices = (it.choices || []).map(c => (c || '').toString().trim())
                            let answerIndex = null
                            if (typeof it.answerIndex === 'number') answerIndex = it.answerIndex
                            else if (typeof it.answer === 'string') answerIndex = choices.findIndex(c => c === it.answer.trim())
                            return JSON.stringify({ type: 'choice', question, choices, answerIndex })
                          }
                          const question = (it.question || '').toString().trim()
                          const answer = (it.answer || '').toString().trim()
                          return JSON.stringify({ type: 'word', question, answer })
                        }

                        // Build map of local items by normalized key
                        local.items = local.items || []
                        const localMap = new Map()
                        for (const it of local.items) {
                          localMap.set(normalizeKey(it), it)
                        }

                        const uid = (prefix='pi_') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,8)
                        let added = 0
                        let updated = 0

                        for (const r of remoteItems) {
                          const key = normalizeKey(r)
                          if (localMap.has(key)) {
                            // update existing local item (preserve local id)
                            const existing = localMap.get(key)
                            // copy fields from remote into existing (keep existing.id)
                            Object.assign(existing, { ...r })
                            updated++
                          } else {
                            // new remote item -> append
                            local.items.push({ id: uid(), ...r })
                            added++
                          }
                        }

                        // persist sharedDocId if not present
                        try { if (!local.sharedDocId) local.sharedDocId = docId } catch (e) {}
                        storage.saveData(d)
                        alert('リモートから取り込んだ結果: 追加 ' + added + ' 件, 更新 ' + updated + ' 件')
                        setTick(t => t + 1)
                      } catch (err) {
                        console.error('checkUpdate error', err)
                        alert('更新確認に失敗しました: ' + (err?.message || String(err)))
                      } finally {
                        setLoadingImport(false)
                      }
                    }}>更新確認</button>
                    <button className="btn" onClick={async () => {
                      // リモートの差分をローカルに取り込む（上書きではなく新規追加）
                      const localData = storage.getData()
                      const localPs = (localData.problemSets || []).find(x => x.id === s.id)
                      let docId = localPs?.sharedDocId
                      setLoadingImport(true)
                      try {
                        const fh = await import('../../firebaseHelper')
                        if (!docId && localPs && localPs.name) {
                          try {
                            const { db, helpers } = await fh.ensureInit()
                            const colRef = helpers.collection(db, 'sharedProblemSets')
                            const q = helpers.query(colRef, helpers.where('payload.name', '==', localPs.name))
                            const snaps = await helpers.getDocs(q)
                            if (!snaps.empty) docId = snaps.docs[0].id
                          } catch (e) {
                            console.warn('query failed', e)
                          }
                        }
                        if (!docId) {
                          docId = prompt('取り込むリモートのドキュメント ID を入力してください')
                          if (!docId) return
                        }
                        const payload = await fh.downloadProblemSet(docId)
                        if (!payload) return alert('指定のドキュメントが見つかりませんでした')
                        const maybe = payload.payload || payload
                        const remote = maybe.type === 'problemSet' ? maybe : (maybe.items ? maybe : null)
                        if (!remote) return alert('取得したデータが問題集フォーマットではありません')

                        const d = storage.getData()
                        const local = (d.problemSets || []).find(x => x.id === s.id)
                        if (!local) return alert('ローカルの問題集が見つかりません')

                        const remoteItems = remote.items || []
                        const localItems = local.items || []
                        // Normalize items for robust duplicate detection:
                        // - trim strings, lowercase for comparison, include type, question, answer/choices
                        const normalizeKey = (it) => {
                          const type = (it.type || 'word')
                          if (type === 'choice') {
                            const question = (it.question || '').toString().trim()
                            const choices = (it.choices || []).map(c => (c || '').toString().trim())
                            // answerIndex may be stored or answer string; normalize to index where possible
                            let answerIndex = null
                            if (typeof it.answerIndex === 'number') answerIndex = it.answerIndex
                            else if (typeof it.answer === 'string') answerIndex = choices.findIndex(c => c === it.answer.trim())
                            return JSON.stringify({ type: 'choice', question, choices, answerIndex })
                          }
                          const question = (it.question || '').toString().trim()
                          const answer = (it.answer || '').toString().trim()
                          return JSON.stringify({ type: 'word', question, answer })
                        }
                        const existing = new Set(localItems.map(it => normalizeKey(it)))
                        let added = 0
                        for (const it of remoteItems) {
                          const key = normalizeKey(it)
                          if (!existing.has(key)) {
                            const newId = 'pi_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8)
                            local.items = local.items || []
                            local.items.push({ id: newId, ...it })
                            existing.add(key)
                            added++
                          }
                        }
                        if (added === 0) return alert('取り込む差分はありませんでした')
                        // persist sharedDocId if not present
                        try { if (!local.sharedDocId) local.sharedDocId = docId } catch (e) {}
                        storage.saveData(d)
                        alert('リモートから ' + added + ' 件を取り込みました')
                        setTick(t => t + 1)
                      } catch (err) {
                        console.error('importDiff error', err)
                        alert('取り込みに失敗しました: ' + (err?.message || String(err)))
                      } finally {
                        setLoadingImport(false)
                      }
                    }}>取り込む</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="viewer">
        {!selectedId && <div className="empty">右側で問題集を選択すると本のように表示します</div>}
        {selectedId && (
          <div className="bookWrap">
            <div style={{ marginBottom: 8 }}>
              <button className="btn" onClick={() => setSelectedId(null)}>◀ 戻る</button>
            </div>
            <div className="book">
              <div className="page left">
                <div className="qnum">{pageIndex + 1}/{items.length}</div>
                <div className="content">{items[pageIndex]?.question}</div>
              </div>
              <div className="page right" onClick={() => setShowAnswer(!showAnswer)}>
                <div className="hint">(クリックで答えを表示)</div>
                <div className="content answer">{showAnswer ? (items[pageIndex]?.type === 'choice' ? (
                  items[pageIndex].answerIndex != null ? `${items[pageIndex].answerIndex + 1}. ${items[pageIndex].choices?.[items[pageIndex].answerIndex]}` : items[pageIndex].answer
                ) : (
                  items[pageIndex].answer
                )) : '—'}</div>
              </div>
            </div>

            <div className="bookControls">
              <button onClick={prev} disabled={pageIndex === 0}>前へ</button>
              <button onClick={next} disabled={pageIndex >= items.length - 1}>次へ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
