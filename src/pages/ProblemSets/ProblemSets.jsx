import { useState } from 'react'
import * as storage from '../../storage'
import './ProblemSets.css'

export default function ProblemSets({ onOpen }) {
  const sets = storage.getProblemSets()
  const [selectedId, setSelectedId] = useState(null)
  const items = selectedId ? storage.getProblemSetItems(selectedId) : []
  const [pageIndex, setPageIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

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
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>インポート</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea id="importJson" placeholder='ここに共有された JSON を貼り付けて「インポート」を押してください' style={{ width: '100%', minHeight: 60 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => {
                const t = document.getElementById('importJson')?.value
                if (!t) return alert('JSON を貼り付けてください')
                try {
                  const obj = JSON.parse(t)
                  if (obj.type === 'problemSet') {
                    const id = storage.importProblemSet(obj)
                    alert('問題集をインポートしました')
                    setSelectedId(id)
                  } else if (obj.type === 'group') {
                    const id = storage.importGroup(obj)
                    alert('グループをインポートしました')
                    setSelectedId(null)
                  } else {
                    alert('サポートされていない JSON 形式です')
                  }
                } catch (e) {
                  alert('JSON の解析に失敗しました')
                }
              }} className="btn">インポート</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Firestore からインポート（ドキュメント名/ID）</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select id="fsType" style={{ padding: 8 }}>
              <option value="problemSet">problemSet</option>
              <option value="group">group</option>
            </select>
            <input id="fsDocId" placeholder="ドキュメント ID を入力" style={{ flex: 1, padding: 8 }} />
            <button className="btn" onClick={async () => {
              const id = document.getElementById('fsDocId')?.value?.trim()
              const type = document.getElementById('fsType')?.value
              if (!id) return alert('ドキュメント ID を入力してください')
              try {
                const fh = await import('../../firebaseHelper')
                if (type === 'problemSet') {
                  const payload = await fh.downloadProblemSet(id)
                  if (!payload) return alert('指定のドキュメントが見つかりませんでした')
                  if (payload.type !== 'problemSet') {
                    // If payload is wrapped (older format), try { payload.payload }
                    const maybe = payload.payload || payload
                    if (maybe.type === 'problemSet' || maybe.items) {
                      const newId = storage.importProblemSet(maybe)
                      alert('問題集をインポートしました（id: ' + newId + '）')
                      setSelectedId(newId)
                      return
                    }
                    return alert('取得したデータが問題集フォーマットではありません')
                  }
                  const newId = storage.importProblemSet(payload)
                  alert('問題集をインポートしました（id: ' + newId + '）')
                  setSelectedId(newId)
                } else {
                  const payload = await fh.downloadGroup(id)
                  if (!payload) return alert('指定のドキュメントが見つかりませんでした')
                  const newId = storage.importGroup(payload)
                  alert('グループをインポートしました（id: ' + newId + '）')
                }
              } catch (err) {
                console.error('Firestore import error', err)
                alert('Firestore からの取り込みに失敗しました: ' + (err?.message || String(err)))
              }
            }}>Firestore からインポート</button>
          </div>
        </div>
        {sets.length === 0 && <p>まだ問題集がありません。</p>}
        <ul className="setsList">
          {sets.map(s => (
            <li key={s.id} className="setRow">
              <div>
                <strong>{s.name}</strong>
                <div className="meta">{(s.items || s.wordIds || []).length} 問</div>
              </div>
              <div className="actions">
                <div className="primary-actions">
                  <button className="btn" onClick={() => openAsBook(s.id)}>本のように開く</button>
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
                      // fallback
                      prompt('以下をコピーして共有してください', text)
                    }
                  }}>共有</button>
                  <button className="btn" onClick={async () => {
                    try {
                      const data = storage.exportProblemSet(s.id)
                      const id = await (await import('../../firebaseHelper')).uploadProblemSet(data)
                      const url = window.location.origin + window.location.pathname + `?shared_ps=${id}`
                      try { await navigator.clipboard.writeText(url); alert('共有URLをコピーしました: ' + url) } catch { prompt('共有URL', url) }
                    } catch (err) {
                      console.error('uploadProblemSet error', err)
                      alert('Firebase へのアップロードに失敗しました: ' + (err?.message || String(err)))
                    }
                  }}>アップロード</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="viewer">
        {!selectedId && <div className="empty">右側で問題集を選択すると本のように表示します</div>}
        {selectedId && (
          <div className="bookWrap">
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
