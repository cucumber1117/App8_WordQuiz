import * as stor from '../storage'

export default function WrongList({ wrongs = [], onClear, onRefresh }) {
  return (
    <div className="wrong-list">
      <h3>間違いリスト ({wrongs.length})</h3>
      {wrongs.length === 0 && <p>間違いはありません。</p>}
      <ul>
        {wrongs.map((w) => (
          <li key={w.id} className="word-item">
            <div>
              <strong>{w.word}</strong> — <span>{w.meaning}</span>
            </div>
            <div>
              <button className="btn" onClick={() => { stor.removeWrong(w.id); onRefresh(); }}>リストから削除</button>
            </div>
          </li>
        ))}
      </ul>

      {wrongs.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => { onClear(); }}>全てクリア</button>
        </div>
      )}
    </div>
  )
}
