import { useState } from 'react'
import * as storage from '../../storage'
import AddWordForm from '../../components/AddWordForm'
import WordList from '../../components/WordList'
import './CreateBook.css' 

export default function CreateBook() {
  const [dataVersion, setDataVersion] = useState(0)
  const data = storage.getData()
  const [selectedGroup, setSelectedGroup] = useState(null)

  const refresh = () => setDataVersion((v) => v + 1)

  const handleAddGroup = (name) => { storage.addGroup(name); refresh() }
  const handleAddWord = ({ groupId, word, meaning }) => { storage.addWord({ groupId, word, meaning }); refresh() }
  const handleDeleteWord = (id) => { storage.deleteWord(id); refresh() }

  const groups = storage.getData().groups
  const words = selectedGroup ? storage.getWordsByGroup(selectedGroup) : []

  return (
    <div className="create-book layout">
      <main className="main full">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div className="center-block">
            <label>グループ</label>
            <select value={selectedGroup || ''} onChange={(e) => setSelectedGroup(e.target.value)}>
              <option value="">-- 選択 --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            <div className="group-actions">
              <input placeholder="新しいグループ名" id="newGroupName" />
              <div className="actions-row">
                <button className="add-btn large" onClick={() => { const el = document.getElementById('newGroupName'); if (el && el.value.trim()) { handleAddGroup(el.value.trim()); el.value = ''; } }}>＋ グループ追加</button>
                <button className="btn" onClick={async () => {
                  if (!selectedGroup) return alert('エクスポートするグループを選択してください')
                  const data = storage.exportGroup(selectedGroup)
                  if (!data) return alert('エクスポートできません')
                  const text = JSON.stringify(data)
                  try {
                    await navigator.clipboard.writeText(text)
                    alert('グループの JSON をクリップボードにコピーしました')
                  } catch (e) {
                    prompt('以下をコピーして共有してください', text)
                  }
                }}>共有</button>
                <button className="btn" onClick={async () => {
                  if (!selectedGroup) return alert('アップロードするグループを選択してください')
                  try {
                    const data = storage.exportGroup(selectedGroup)
                    const id = await (await import('../../firebaseHelper')).uploadGroup(data)
                    const url = window.location.origin + window.location.pathname + `?shared_g=${id}`
                    try { await navigator.clipboard.writeText(url); alert('共有URLをコピーしました: ' + url) } catch { prompt('共有URL', url) }
                  } catch (err) {
                    console.error('uploadGroup error', err)
                    alert('Firebase へのアップロードに失敗しました: ' + (err?.message || String(err)))
                  }
                }}>アップロード</button>
              </div>
            </div>

            {!selectedGroup ? (
              <div className="import-block">
                <label>インポート (グループ/問題集)</label>
                <div className="import-row">
                  <textarea id="importJsonGroup" placeholder='ここに共有された JSON を貼り付けて「インポート」を押してください' />
                  <div className="import-actions">
                    <button className="btn" onClick={() => {
                      const t = document.getElementById('importJsonGroup')?.value
                      if (!t) return alert('JSON を貼り付けてください')
                      try {
                        const obj = JSON.parse(t)
                        if (obj.type === 'group') {
                          const id = storage.importGroup(obj)
                          alert('グループをインポートしました')
                          setSelectedGroup(id)
                          refresh()
                        } else if (obj.type === 'problemSet') {
                          const id = storage.importProblemSet(obj)
                          alert('問題集をインポートしました')
                          refresh()
                        } else {
                          alert('サポートされていない JSON 形式です')
                        }
                      } catch (e) {
                        alert('JSON の解析に失敗しました')
                      }
                    }}>インポート</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                <button className="btn" onClick={() => setSelectedGroup(null)}>◀ 戻る</button>
                <div style={{ marginTop: 8, fontWeight: 700 }}>{groups.find(g => g.id === selectedGroup)?.name || '—'}</div>
                <div style={{ marginTop: 6, color: '#666' }}>{(storage.getWordsByGroup(selectedGroup) || []).length} 単語</div>
              </div>
            )}
          </div>
        </div>

        {!selectedGroup ? (
          <div className="empty-state">
            <h2 className="section-title">グループを選択してください</h2>
            {groups.length === 0 && (
              <p className="hint">まだグループがありません。「＋ グループ追加」から作成してください。</p>
            )}
          </div>
        ) : (
          <div className="panel">
            <h3 className="section-title">単語管理</h3>
            <AddWordForm
              groups={groups}
              defaultGroupId={selectedGroup}
              onAdd={handleAddWord}
            />
            <WordList words={words} onDelete={handleDeleteWord} />
          </div>
        )}
      </main>
    </div>
  )
}
