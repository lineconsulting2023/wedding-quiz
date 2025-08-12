
import Link from 'next/link';
export default function Home(){
  return (
    <main>
      <h1>Wedding Quiz</h1>
      <p>使う画面を選んでください。</p>
      <ul>
        <li><Link href="/join">参加者 /join</Link></li>
        <li><Link href="/host">司会者 /host</Link></li>
        <li><Link href="/screen">スクリーン /screen</Link></li>
      </ul>
      <footer>UI: 白×黒＋アクセント / 音なし</footer>
    </main>
  )
}
