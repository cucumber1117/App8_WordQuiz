export default function WordList({ words, onDelete }) {
  return (
    <div className="word-list" style={{ marginTop: 16 }}>
      <h3>単語一覧 ({words.length})</h3>
      {words.length === 0 && <p>このグループに単語がありません。</p>}
      <ul>
        {words.map((w) => (
          <li key={w.id} className="word-item">
            <div>
              <strong>{w.word}</strong> — <span>{w.meaning}</span>
            </div>
            <div>
              <button className="btn" onClick={() => onDelete(w.id)}>削除</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
