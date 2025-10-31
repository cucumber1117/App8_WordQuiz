import { useState } from 'react'
import * as storage from './storage'
import CreateBook from './pages/CreateBook/CreateBook'
import QuizPage from './pages/QuizPage/QuizPage'
import ProblemSet from './pages/ProblemSet/ProblemSet'
import ProblemSets from './pages/ProblemSets/ProblemSets'

export default function Home() {
  const [page, setPage] = useState('home') // 'home' | 'create' | 'quiz'
  const recentGroups = storage.getRecentGroups(5)
  const recentProblemSets = storage.getRecentProblemSets(5)

  return (
    <div className="home-page">
      {page === 'home' && (
        <>
          <section className="hero">
            <h2>Word Quiz</h2>
            <p>グループごとに単語を追加して、クイズで覚えましょう。</p>

            <div className="hero-actions" style={{ marginTop: 20 }}>
              <button className="btn" onClick={() => setPage('create')}>単語帳の作成</button>
              <button className="btn" onClick={() => setPage('problem')}>問題集の作成</button>
              <button className="btn" onClick={() => setPage('problemList')}>問題集一覧</button>
              <button className="btn" onClick={() => setPage('quiz')}>クイズ</button>
            </div>
          </section>

          {/* 最近使ったはヒーローとは分けて下に表示 */}
          {(recentGroups.length > 0 || recentProblemSets.length > 0) && (
            <div className="recent-panel">
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                {recentGroups.length > 0 && (
                  <div style={{ minWidth: 220 }}>
                    <h4>最近使った単語帳</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {recentGroups.map(g => (
                        <li key={g.id} style={{ marginBottom: 8 }}>
                          <button className="btn" onClick={() => { storage.savePendingSelection('group', g.id); setPage('quiz') }}>{g.name}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recentProblemSets.length > 0 && (
                  <div style={{ minWidth: 220 }}>
                    <h4>最近使った問題集</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {recentProblemSets.map(p => (
                        <li key={p.id} style={{ marginBottom: 8 }}>
                          <button className="btn" onClick={() => { storage.savePendingSelection('problem', p.id); setPage('quiz') }}>{p.name}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {page === 'create' && (
        <div>
          <div className="back-row" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => setPage('home')}>← ホームに戻る</button>
          </div>
          <CreateBook />
        </div>
      )}

      {page === 'quiz' && (
        <div>
          <div className="back-row" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => setPage('home')}>← ホームに戻る</button>
          </div>
          <QuizPage />
        </div>
      )}
      {page === 'problem' && (
        <div>
          <div className="back-row" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => setPage('home')}>← ホームに戻る</button>
          </div>
          <ProblemSet />
        </div>
      )}

      {page === 'problemList' && (
        <div>
          <div className="back-row" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => setPage('home')}>← ホームに戻る</button>
          </div>
          <ProblemSets onOpen={(p) => setPage(p)} />
        </div>
      )}
    </div>
  )
}

// Handle shared query params on initial load (attempt to fetch from Firebase if present)
;(async function handleShared() {
  try {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const ps = params.get('shared_ps')
    const pg = params.get('shared_g')
    if (!ps && !pg) return
    // dynamically import firebaseHelper and storage only when needed
    const fh = await import('./firebaseHelper')
    const storage = await import('./storage')
    if (ps) {
      try {
        const obj = await fh.downloadProblemSet(ps)
        if (obj) {
          storage.importProblemSet(obj)
          alert('共有された問題集をインポートしました')
          // remove param from URL
          const u = new URL(window.location.href)
          u.searchParams.delete('shared_ps')
          window.history.replaceState({}, '', u.toString())
        } else {
          alert('共有された問題集が見つかりません')
        }
      } catch (e) { alert('共有問題集の取得に失敗しました: ' + e.message) }
    }
    if (pg) {
      try {
        const obj = await fh.downloadGroup(pg)
        if (obj) {
          storage.importGroup(obj)
          alert('共有されたグループをインポートしました')
          const u = new URL(window.location.href)
          u.searchParams.delete('shared_g')
          window.history.replaceState({}, '', u.toString())
        } else {
          alert('共有されたグループが見つかりません')
        }
      } catch (e) { alert('共有グループの取得に失敗しました: ' + e.message) }
    }
  } catch (e) {
    // ignore
  }
})()
