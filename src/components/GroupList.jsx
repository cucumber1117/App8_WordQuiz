import { useState } from 'react'

export default function GroupList({ groups, selectedId, onSelect, onAddGroup }) {
  const [name, setName] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAddGroup(name.trim())
    setName('')
  }

  return (
    <div className="group-list">
      <h3>グループ</h3>
      <ul>
        {groups.map((g) => (
          <li key={g.id}>
            <button
              className={`group-item ${g.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(g.id)}
            >
              {g.name}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} style={{ marginTop: 8 }} className="form-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="新しいグループ" />
        <button type="submit" className="btn">追加</button>
      </form>
    </div>
  )
}
