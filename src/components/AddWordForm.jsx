import { useState } from 'react'

export default function AddWordForm({ groups, defaultGroupId, onAdd }) {
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [groupId, setGroupId] = useState(defaultGroupId || groups[0]?.id)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!word.trim() || !meaning.trim() || !groupId) return
    onAdd({ groupId, word: word.trim(), meaning: meaning.trim() })
    setWord('')
    setMeaning('')
  }

  return (
    <div className="add-word">
      <h3>単語を追加</h3>
      <form onSubmit={handleSubmit} className="form-row">
        <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="単語" />
        <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="意味" />
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button type="submit" className="btn">追加</button>
      </form>
    </div>
  )
}
