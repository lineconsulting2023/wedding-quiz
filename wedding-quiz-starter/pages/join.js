
import { useEffect, useState } from 'react';
import { channel } from '@/lib/ably';

export default function Join(){
  const [room, setRoom] = useState('RYOTA-WED');
  const [name, setName] = useState('ゲスト');
  const [joined, setJoined] = useState(false);
  const [q, setQ] = useState(null);
  const [locked, setLocked] = useState(false);
  const [answered, setAnswered] = useState(null);

  useEffect(()=>{
    if(!joined) return;
    const ch = channel(room);
    const onMessage = (msg)=>{
      const { type, payload } = msg.data;
      if(type === 'question'){ setQ(payload); setLocked(false); setAnswered(null); }
      if(type === 'close'){ setLocked(true); }
      if(type === 'reset'){ setQ(null); setAnswered(null); }
    };
    ch.subscribe(onMessage);
    ch.publish('presence', { type:'join', name });
    return ()=> ch.unsubscribe(onMessage);
  }, [joined, room, name]);

  const handleAnswer = (index)=>{
    if(!q || locked) return;
    setAnswered(index);
    const ch = channel(room);
    ch.publish('answer', { name, qid:q.id, index, ts: Date.now() });
  };

  return (
    <main>
      <h1>参加者</h1>
      {!joined ? (
        <div className="grid">
          <label>ルーム名</label>
          <input value={room} onChange={e=>setRoom(e.target.value)} />
          <label>ニックネーム</label>
          <input value={name} onChange={e=>setName(e.target.value)} />
          <button onClick={()=>setJoined(true)}>入室</button>
        </div>
      ):(
        <div>
          <p>ルーム: <span className="room">{room}</span> / あなた: {name}</p>
          {q ? (
            <div>
              <h2>{q.text}</h2>
              <div className="choices">
                {q.choices.map((c, i)=>(
                  <button key={i} className={"choice "+(locked?'':'enabled')} disabled={locked} onClick={()=>handleAnswer(i)}>
                    {c}{answered===i ? ' ✓' : ''}
                  </button>
                ))}
              </div>
              {locked && <p>締切になりました。結果をお待ちください。</p>}
            </div>
          ) : <p className="center">出題をお待ちください。</p>}
        </div>
      )}
    </main>
  )
}
