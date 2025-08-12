
import { useEffect, useMemo, useRef, useState } from 'react';
import { channel } from '@/lib/ably';
import { QUESTIONS } from '@/questions';

export default function Host(){
  const [room, setRoom] = useState('RYOTA-WED');
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const [answers, setAnswers] = useState([]); // list of {name, qid, index, ts}
  const [leaderboard, setLeaderboard] = useState([]);
  const chRef = useRef(null);

  const q = QUESTIONS[idx];

  useEffect(()=>{
    if(!started) return;
    const ch = channel(room);
    chRef.value = ch;
    const onAnswer = (msg)=>{
      const d = msg.data;
      if(d.qid !== q.id) return;
      // 排他: 1人1回答（最初の回答を採用）
      setAnswers(prev => {
        if(prev.some(a => a.name === d.name)) return prev;
        return [...prev, d];
      });
    };
    ch.subscribe('answer', onAnswer);
    return ()=> ch.unsubscribe('answer', onAnswer);
  }, [started, room, idx]);

  const broadcast = (type, payload)=>{
    const ch = channel(room);
    ch.publish('broadcast', { type, payload });
  };

  const startQuestion = ()=>{
    setAnswers([]);
    setCollecting(true);
    broadcast('question', q);
  };

  const closeQuestion = ()=>{
    setCollecting(false);
    broadcast('close', {});
  };

  const sendResult = ()=>{
    // 集計
    const counts = new Array(q.choices.length).fill(0);
    const correctIndex = q.answerIndex;
    const correctNames = new Set();
    answers.forEach(a=>{
      counts[a.index] = (counts[a.index]||0)+1;
      if(a.index === correctIndex) correctNames.add(a.name);
    });
    // リーダーボード更新（正解+1、同点は早押し優先: 細かい実装は簡易）
    setLeaderboard(prev => {
      const map = new Map(prev.map(p=>[p.name, p]));
      answers.forEach(a=>{
        const cur = map.get(a.name) || { name:a.name, score:0, time:0 };
        const delta = (a.index===correctIndex) ? 1 : 0;
        const best = (cur.time===0) ? a.ts : Math.min(cur.time, a.ts);
        map.set(a.name, { name:a.name, score: cur.score + delta, time: best });
      });
      const arr = Array.from(map.values()).sort((a,b)=>{
        if(b.score!==a.score) return b.score-a.score;
        return a.time-b.time;
      });
      return arr;
    });

    const payload = { counts, correctIndex, total: answers.length, qid:q.id };
    broadcast('result', payload);
  };

  const nextQuestion = ()=>{
    setAnswers([]);
    setCollecting(false);
    broadcast('reset', {});
    setIdx(i=> Math.min(i+1, QUESTIONS.length-1));
  };

  return (
    <main>
      <h1>司会者</h1>
      {!started ? (
        <div className="grid">
          <label>ルーム名</label>
          <input value={room} onChange={e=>setRoom(e.target.value)} />
          <button onClick={()=>setStarted(true)}>ルーム作成</button>
        </div>
      ) : (
        <div>
          <p>ルーム: <span className="room">{room}</span></p>
          <h2>Q{idx+1}. {q.text}</h2>
          <ol>
            {q.choices.map((c,i)=>(<li key={i}>{i+1}. {c}{i===q.answerIndex?' (正解)':''}</li>))}
          </ol>
          <div className="grid" style={{marginTop:12}}>
            {!collecting ? <button onClick={startQuestion}>出題</button> : <button className="secondary" onClick={closeQuestion}>締切</button>}
            <button onClick={sendResult}>結果送信</button>
            <button className="secondary" onClick={nextQuestion} disabled={idx===QUESTIONS.length-1}>次の問題へ</button>
          </div>

          <h3>回答（{answers.length}）</h3>
          <ul className="rank">
            {answers.map((a,i)=>(<li key={i}>{a.name} → {q.choices[a.index]}</li>))}
          </ul>

          <h3>総合順位（上位10）</h3>
          <ol className="rank">
            {leaderboard.slice(0,10).map((p,i)=>(<li key={p.name}>{i+1}. {p.name}：{p.score}点</li>))}
          </ol>
        </div>
      )}
    </main>
  );
}
