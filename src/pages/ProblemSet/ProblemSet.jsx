import { useState, useEffect } from 'react'
import * as storage from '../../storage'
import './ProblemSet.css'

export default function ProblemSet() {
  const [step, setStep] = useState('select') // select | create | view
  const [selectedSetId, setSelectedSetId] = useState(null)
  const [problemType, setProblemType] = useState('choice')
  const [choices, setChoices] = useState([{ text: '' }, { text: '' }])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [name, setName] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)

  const problemSets = storage.getProblemSets()
  const selectedSet = problemSets.find(ps => ps.id === selectedSetId)

  // If Home / ProblemSets saved a pending selection, apply it on mount.
  useEffect(() => {
    try {
      const pending = storage.getPendingSelection()
      if (pending && pending.type === 'problem' && pending.id) {
        setSelectedSetId(pending.id)
        setStep('create')
        storage.clearPendingSelection()
      }
    } catch (e) {}
  }, [])

  const createSet = () => {
    if (!name.trim()) return alert('問題集名を入力してください')
    storage.addProblemSetWithItems(name.trim(), [])
    setSelectedSetId(storage.getProblemSets().slice(-1)[0].id)
    setStep('create')
  }

  const addChoice = () => setChoices([...choices, { text: '' }])
  const removeChoice = (i) => setChoices(choices.filter((_, idx) => idx !== i))
  const updateChoice = (i, val) => {
    const newChoices = [...choices]
    newChoices[i].text = val
    setChoices(newChoices)
  }

  const saveProblem = () => {
    if (!selectedSetId) return alert('問題集を選択してください')
    if (!question.trim()) return alert('問題文を入力してください')

    if (problemType === 'choice') {
      const filledChoices = choices.map(c => c.text.trim()).filter(Boolean)
      if (filledChoices.length < 2) return alert('選択肢を2つ以上入力してください')
      if (correctIndex == null || correctIndex < 0 || correctIndex >= filledChoices.length) return alert('正しい選択肢を選んでください')
      const item = { type: 'choice', question, choices: filledChoices, answerIndex: correctIndex }
      if (editingIndex != null) {
        storage.updateProblemInSet(selectedSetId, editingIndex, item)
      } else {
        storage.addProblemToSet(selectedSetId, item)
      }
    } else {
      if (!answer.trim()) return alert('答えを入力してください')
      const item = { type: 'word', question, answer }
      if (editingIndex != null) {
        storage.updateProblemInSet(selectedSetId, editingIndex, item)
      } else {
        storage.addProblemToSet(selectedSetId, item)
      }
    }

    setQuestion('')
    setAnswer('')
    setChoices([{ text: '' }, { text: '' }])
    setCorrectIndex(0)
    setEditingIndex(null)
    alert('問題を保存しました')
    setStep('view')
  }

  const editProblem = (i) => {
    if (!selectedSet) return
    const item = selectedSet.items?.[i]
    if (!item) return
    setProblemType(item.type || 'word')
    setQuestion(item.question || '')
    if (item.type === 'choice') {
      setChoices((item.choices || []).map(c => ({ text: c })))
      setCorrectIndex(item.answerIndex ?? 0)
    } else {
      setAnswer(item.answer || '')
      setChoices([{ text: '' }, { text: '' }])
      setCorrectIndex(0)
    }
    setEditingIndex(i)
    setStep('create')
  }

  const deleteProblem = (setId, index) => {
    storage.removeProblemFromSet(setId, index)
    setStep('view')
  }

  return (
    <div className="problem-set-container">
      {step === 'select' && (
        <div className="panel">
          <h3>問題集を選択</h3>
          {problemSets.length === 0 && <p>まだ問題集がありません。</p>}
          <ul className="list">
            {problemSets.map(ps => (
              <li key={ps.id}>
                <button
                  className="selectBtn"
                  onClick={() => { setSelectedSetId(ps.id); setStep('create'); }}
                >
                  {ps.name}
                </button>
              </li>
            ))}
          </ul>

          <div className="newSet">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="新しい問題集名"
            />
            <button onClick={createSet}>作成</button>
          </div>
          <div style={{ marginTop: 12, borderTop: '1px dashed #e6eef5', paddingTop: 12 }}>
            <button
              className="btn"
              onClick={async () => {
                try {
                  const raw = storage.getData()
                  const text = JSON.stringify(raw, null, 2)
                  await navigator.clipboard.writeText(text)
                  alert('ストレージの内容をクリップボードにコピーしました。')
                } catch (e) {
                  alert('コピーに失敗しました: ' + (e && e.message ? e.message : e))
                }
              }}
            >ストレージ内容をコピー</button>
          </div>
        </div>
      )}

      {(step === 'create' || step === 'view') && (
        <div className="panel">
          {step === 'create' && <h3>問題を作成</h3>}
          {step === 'view' && <h3>{selectedSet?.name} の問題一覧</h3>}

          {step === 'create' && (
            <>
              <div className="formRow">
                <label>問題形式</label>
                <div className="typeSelector">
                  <button
                    className={problemType === 'choice' ? 'active' : ''}
                    onClick={() => setProblemType('choice')}
                  >
                    選択問題
                  </button>
                  <button
                    className={problemType === 'word' ? 'active' : ''}
                    onClick={() => setProblemType('word')}
                  >
                    記述問題
                  </button>
                </div>
              </div>

              <div className="formRow">
                <label>問題文</label>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="例: 'apple' の意味は？"
                />
              </div>

              {problemType === 'choice' && (
                <div className="choicesBox">
                  <label>選択肢</label>
                  {choices.map((c, i) => (
                    <div key={i} className="choiceRow">
                      <input
                        value={c.text}
                        onChange={(e) => updateChoice(i, e.target.value)}
                        placeholder={`選択肢 ${i + 1}`}
                      />
                      <label style={{ marginLeft: 8 }}>
                        <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} /> 正解
                      </label>
                      {choices.length > 2 && (
                        <button onClick={() => removeChoice(i)}>-</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addChoice}>＋</button>
                </div>
              )}

              <div className="formRow">
                <label>答え</label>
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="正解を入力"
                />
              </div>

              <div className="actions">
                <button onClick={saveProblem}>保存</button>
                <button onClick={() => setStep('view')}>問題を見る</button>
                <button onClick={() => setStep('select')}>戻る</button>
              </div>
            </>
          )}

          {step === 'view' && (
            <>
              <div className="topActions" style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="add-btn large" onClick={() => { setEditingIndex(null); setQuestion(''); setAnswer(''); setChoices([{ text: '' }, { text: '' }]); setStep('create') }}>＋ 問題を追加</button>
                <button className="btn" onClick={() => setStep('select')}>戻る</button>
              </div>

              {selectedSet?.items.length === 0 && <p>まだ問題がありません。</p>}

              <ul className="problemList">
                {selectedSet?.items.map((item, index) => (
                  <li key={index} className="problemItem">
                    <strong>{index + 1}. {item.question}</strong>
                    {item.type === 'choice' && (
                      <ul>
                        {item.choices.map((c, i) => (
                          <li key={i}>・{c}</li>
                        ))}
                      </ul>
                    )}
                    <p>答え: {item.type === 'choice' ? (
                      item.answerIndex != null ? `${item.answerIndex + 1}. ${item.choices[item.answerIndex]}` : (item.answer || '')
                    ) : (
                      item.answer
                    )}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                      <button onClick={() => editProblem(index)}>編集</button>
                      <button onClick={() => deleteProblem(selectedSet.id, index)}>削除</button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
