
import { useEffect, useMemo, useState } from 'react';
import { channel } from '@/lib/ably';

export default function Screen(){
  const [room, setRoom] = useState('RYOTA-WED');
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState('waiting'); // waiting | question | closed | result
  const [q, setQ] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(()=>{
    if(!joined) return;
    const ch = channel(room);
    const onMessage = (msg)=>{
      const { type, payload } = msg.data;
      if(type==='question'){ setState('question'); setQ(payload); setResult(null); }
      if(type==='close'){ setState('closed'); }
      if(type==='result'){ setState('result'); setResult(payload); }
      if(type==='reset'){ setState('waiting'); setQ(null); setResult(null); }
    };
    ch.subscribe(onMessage);
    return ()=> ch.unsubscribe(onMessage);
  }, [joined, room]);

  return (
    <main>
      <h1>スクリーン</h1>
      {!joined ? (
        <div className="grid">
          <label>ルーム名</label>
          <input value={room} onChange={e=>setRoom(e.target.value)} />
          <button onClick={()=>setJoined(true)}>入室</button>
        </div>
      ):(
        <div className="center">
          <p>ルーム: <span className="room">{room}</span></p>
          {state==='waiting' && <div><div className="big">待機中</div><p>出題をお待ちください</p></div>}
          {state==='question' && q && (
            <div>
              <div className="big">解答受付中</div>
              <h2>{q.text}</h2>
            </div>
          )}
          {state==='closed' && <div className="big">締切</div>}
          {state==='result' && result && q && (
            <div>
              <h2>{q.text}</h2>
              {q.choices.map((c, i)=>{
                const total = result.counts.reduce((a,b)=>a+b,0) || 1;
                const width = (result.counts[i]/total*100).toFixed(0)+'%';
                const isCorrect = i===q.answerIndex;
                return (
                  <div key={i} style={{margin:'8px 0'}}>
                    <div>{isCorrect ? '⭐ ' : ''}{c}（{result.counts[i]||0}）</div>
                    <div className="bar"><div style={{width}}></div></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
