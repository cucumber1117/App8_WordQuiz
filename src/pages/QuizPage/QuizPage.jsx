import { useState, useEffect } from 'react'
import * as storage from '../../storage'
import QuizView from '../../components/QuizView'
import './QuizPage.css'

export default function QuizPage() {
  const [groupsVersion, setGroupsVersion] = useState(0)
  const groups = storage.getData().groups
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? null)
  const [running, setRunning] = useState(false)
  const [source, setSource] = useState('group') // 'group' | 'problem'
  const problemSets = storage.getProblemSets()
  const [selectedProblemSet, setSelectedProblemSet] = useState(problemSets[0]?.id ?? null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [randomize, setRandomize] = useState(true)
  const [quizItems, setQuizItems] = useState([])

  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const start = () => {
    const sourceItems = source === 'group'
      ? (words || []).map(w => ({ type: 'word', id: w.id, word: w.word, meaning: w.meaning }))
      : (problemItems || [])

    const total = sourceItems.length
    if (total === 0) return

    const requested = Math.min(numQuestions || 10, total)
    let items = sourceItems
    if (randomize) items = shuffle(items)
    if (requested < items.length) items = items.slice(0, requested)

    setQuizItems(items)
    // record usage
    if (source === 'group' && selectedGroup) {
      storage.touchGroup(selectedGroup)
    }
    if (source === 'problem' && selectedProblemSet) {
      storage.touchProblemSet(selectedProblemSet)
    }
    setRunning(true)
  }

  const stop = () => {
    setRunning(false)
    setQuizItems([])
  }

  const words = selectedGroup ? storage.getWordsByGroup(selectedGroup) : []
  const problemItems = selectedProblemSet ? storage.getProblemSetItems(selectedProblemSet) : []

  const handleRecordWrong = (wordId) => {
    storage.recordWrong(wordId)
  }

  // if Home saved a pending selection, apply it when the page mounts
  useEffect(() => {
    const pending = storage.getPendingSelection()
    if (pending) {
      if (pending.type === 'group') setSelectedGroup(pending.id)
      if (pending.type === 'problem') setSelectedProblemSet(pending.id)
      storage.clearPendingSelection()
    }
  }, [])

  const buildOptions = (total) => {
    const step = 5
    const opts = []
    const maxBase = Math.floor(total / step) * step
    for (let i = step; i <= maxBase; i += step) opts.push(i)
    // if no options (total < step) or not included, include total as last option
    if (opts.length === 0 && total > 0) opts.push(total)
    if (total > 0 && opts[opts.length - 1] !== total) opts.push(total)
    // remove duplicates and sort
    return Array.from(new Set(opts)).sort((a, b) => a - b)
  }

  const groupOptions = buildOptions(words.length)
  const problemOptions = buildOptions(problemItems.length)

  return (
    <div className="quiz-layout layout">
      {/* === 左サイド === */}
      <aside className="sidebar">
        <h3>クイズ設定</h3>

        <div className="formRow">
          <label>データソース</label>
          <div className="typeSelector">
            <button
              className={source === 'group' ? 'active' : ''}
              onClick={() => setSource('group')}
            >
              グループ
            </button>
            <button
              className={source === 'problem' ? 'active' : ''}
              onClick={() => setSource('problem')}
            >
              問題集
            </button>
          </div>
        </div>

        {source === 'group' && (
          <div className="formRow">
            <label>グループ選択</label>
            <select
              value={selectedGroup || ''}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <div className="settings-row" style={{ marginTop: 10 }}>
              <div className="settings-group">
                <label>
                  <input
                    type="checkbox"
                    checked={randomize}
                    onChange={(e) => setRandomize(e.target.checked)}
                  /> ランダム
                </label>
                <label>
                  出題数:
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                  >
                    {groupOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              </div>
              <button
                className="primary"
                onClick={start}
                disabled={!selectedGroup || words.length === 0}
              >
                クイズ開始
              </button>
            </div>
          </div>
        )}

        {source === 'problem' && (
          <div className="formRow">
            <label>問題集選択</label>
            <select
              value={selectedProblemSet || ''}
              onChange={(e) => setSelectedProblemSet(e.target.value)}
            >
              {problemSets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="settings-row" style={{ marginTop: 10 }}>
              <div className="settings-group">
                <label>
                  <input
                    type="checkbox"
                    checked={randomize}
                    onChange={(e) => setRandomize(e.target.checked)}
                  /> ランダム
                </label>
                <label>
                  出題数:
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                  >
                    {problemOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              </div>
              <button
                className="primary"
                onClick={start}
                disabled={!selectedProblemSet || problemItems.length === 0}
              >
                クイズ開始
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* === メインパネル === */}
      <main className="main">
        <div className="panel">
          {!running && (
            <div className="intro">
              {source === 'group' ? (
                <>
                  <p>選択中のグループ：{groups.find(g => g.id === selectedGroup)?.name ?? 'なし'}</p>
                  <p>単語数：{words.length}</p>
                </>
              ) : (
                <>
                  <p>選択中の問題集：{problemSets.find(p => p.id === selectedProblemSet)?.name ?? 'なし'}</p>
                  <p>問題数：{problemItems.length}</p>
                </>
              )}
              <p>クイズを開始するには左のパネルで「クイズ開始」を押してください。</p>
            </div>
          )}

          {running && (
            <div className="quiz-area">
              <div className="quiz-header">
                <button className="secondary" onClick={stop}>終了して戻る</button>
              </div>
              <QuizView
                items={quizItems}
                onRecordWrong={handleRecordWrong}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
