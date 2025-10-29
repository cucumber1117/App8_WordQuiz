import { useEffect, useState } from 'react'
import './App.css'
import * as storage from './storage'
// GroupList removed from left sidebar by request
import AddWordForm from './components/AddWordForm'
import WordList from './components/WordList'
import QuizView from './components/QuizView'
import WrongList from './components/WrongList'

function App() {
  const [data, setData] = useState(storage.getData())
  const [selectedGroupId, setSelectedGroupId] = useState(data.groups[0]?.id ?? null)
  const [mode, setMode] = useState('manage') // 'manage' | 'quiz' | 'wrongs'

  useEffect(() => {
    // keep selectedGroupId valid when groups change
    if (!data.groups.find((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(data.groups[0]?.id ?? null)
    }
  }, [data, selectedGroupId])

  const refresh = () => setData(storage.getData())

  const handleAddGroup = (name) => {
    storage.addGroup(name)
    refresh()
  }

  const handleAddWord = ({ groupId, word, meaning }) => {
    storage.addWord({ groupId, word, meaning })
    refresh()
  }

  const handleDeleteWord = (wordId) => {
    storage.deleteWord(wordId)
    refresh()
  }

  const handleRecordWrong = (wordId) => {
    storage.recordWrong(wordId)
    refresh()
  }

  const handleClearWrongs = () => {
    storage.clearWrongList()
    refresh()
  }

  const wordsForSelected = selectedGroupId ? storage.getWordsByGroup(selectedGroupId) : []
  const wrongs = storage.getWrongList()

  return (
    <div id="root">
      <header className="app-header">
        <h1 className="app-title">単語覚えるアプリ</h1>
        <p className="app-sub">シンプルな学習・クイズアプリ</p>
      </header>

      <div className="layout">
        <main className="main full">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'inline-block', textAlign: 'left' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>グループ</label>
              <select value={selectedGroupId || ''} onChange={(e) => setSelectedGroupId(e.target.value)} style={{ minWidth: 240, padding: 6, borderRadius:6 }}>
                {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn" onClick={() => setMode('manage')} disabled={mode === 'manage'}>管理</button>
                <button className="btn" onClick={() => setMode('quiz')} disabled={mode === 'quiz' || !selectedGroupId}>グループでクイズ</button>
                <button className="btn" onClick={() => setMode('wrongs')} disabled={mode === 'wrongs'}>間違いリスト ({wrongs.length})</button>
              </div>
            </div>
          </div>
            {mode === 'manage' && (
              <div className="panel">
                <AddWordForm groups={data.groups} defaultGroupId={selectedGroupId} onAdd={handleAddWord} />
                <WordList words={wordsForSelected} onDelete={handleDeleteWord} />
              </div>
            )}

            {mode === 'quiz' && selectedGroupId && (
              <div className="panel">
                <QuizView words={wordsForSelected} onRecordWrong={handleRecordWrong} />
              </div>
            )}

            {mode === 'wrongs' && (
              <div className="panel">
                <WrongList wrongs={wrongs} onClear={handleClearWrongs} onRefresh={refresh} />
              </div>
            )}
          </main>
        </div>
    </div>
  )
}

export default App
