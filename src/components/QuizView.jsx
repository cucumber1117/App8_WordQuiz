import { useState, useRef } from 'react'

export default function QuizView({ words = [], items = [], onRecordWrong }) {
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const inputRef = useRef(null)
  // choose source: items (problem-set) take precedence; otherwise words (group)
  const source = (items && items.length > 0) ? items : words

  if (!source || source.length === 0) {
    return <p>問題がありません。まずグループや問題集を準備してください。</p>
  }

  const current = source[index]

  const normalize = (s) => (s || '').toString().trim().toLowerCase()

  const submitAnswer = (e, selectedChoiceIndex = null) => {
    e?.preventDefault()
    // handle choice-type items vs word-type
    if (current.type === 'choice') {
      // selectedChoiceIndex is expected; if null, ignore
      if (selectedChoiceIndex == null) return
      const correctIdx = current.answerIndex
      if (selectedChoiceIndex === correctIdx) {
        setFeedback('correct')
        setCorrectCount((c) => c + 1)
        setTimeout(() => goNext(), 700)
      } else {
        setFeedback('wrong')
        setShowCorrectAnswer(true)
      }
      return
    }

      // treat as word/qa item
      const user = normalize(answer)
      if (!user) return

      // If this item has a `word` field (group word), expect the user to input the word
      if (current.word != null) {
        const correct = normalize(current.word)
        if (user === correct) {
          setFeedback('correct')
          setCorrectCount((c) => c + 1)
          setTimeout(() => goNext(), 700)
        } else {
          setFeedback('wrong')
          setShowCorrectAnswer(true)
          if (typeof onRecordWrong === 'function' && current.id) onRecordWrong(current.id)
        }
        return
      }

      // fallback: for non-word QA items, compare against meaning/answer as before
      const correct = normalize(current.meaning ?? current.answer)
      if (user === correct) {
        setFeedback('correct')
        setCorrectCount((c) => c + 1)
        setTimeout(() => goNext(), 700)
      } else {
        setFeedback('wrong')
        setShowCorrectAnswer(true)
        if (typeof onRecordWrong === 'function' && current.id) onRecordWrong(current.id)
      }
  }

  const goNext = () => {
    setAnswer('')
    setFeedback(null)
    setShowCorrectAnswer(false)
    if (index + 1 < source.length) {
      setIndex(index + 1)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setIndex(source.length)
    }
  }

  if (index >= source.length) {
    return (
      <div className="quiz-result">
        <h3>終了</h3>
        <p>
          正解: {correctCount} / {source.length}
        </p>
        <button className="btn" onClick={() => { setIndex(0); setCorrectCount(0); setAnswer(''); setFeedback(null); }}>もう一度</button>
      </div>
    )
  }

  // render per item type
  return (
    <div className="quiz">
      <h3>クイズ ({index + 1}/{source.length})</h3>

      {current.type === 'choice' ? (
        <div>
          <div className="quiz-word">{current.question}</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {current.choices.map((c, i) => (
              <button key={i} className="btn" onClick={(e) => submitAnswer(e, i)}>{i + 1}. {c}</button>
            ))}
          </div>

          {feedback === 'correct' && <div className="feedback correct">正解！</div>}
          {feedback === 'wrong' && (
            <div className="feedback wrong">不正解。正しい答え: <strong>{current.answerIndex != null ? `${current.answerIndex + 1}. ${current.choices[current.answerIndex]}` : current.answer}</strong></div>
          )}
          {showCorrectAnswer && (
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={goNext}>次へ</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* If this is a group word item, show meaning and ask for the word. Otherwise keep existing behavior. */}
          <div className="quiz-word">{current.word != null ? (current.meaning ?? '—') : (current.word ?? current.question)}</div>

          <form onSubmit={submitAnswer} style={{ marginTop: 8 }}>
            <input
              ref={inputRef}
              className="answer-input"
              placeholder={current.word != null ? "単語を入力して Enter またはボタンで判定" : "意味を入力して Enter またはボタンで判定"}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={feedback === 'correct'}
              autoFocus
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button type="submit" className="btn">判定</button>
              <button type="button" className="btn" onClick={goNext}>スキップ</button>
            </div>
          </form>

          {feedback === 'correct' && <div className="feedback correct">正解！</div>}
          {feedback === 'wrong' && (
            <div className="feedback wrong">
              不正解。{current.word != null ? '正しい単語' : '正しい意味'}: <strong>{current.word != null ? current.word : (current.meaning ?? current.answer)}</strong>
            </div>
          )}
          {showCorrectAnswer && (
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={goNext}>次へ</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
