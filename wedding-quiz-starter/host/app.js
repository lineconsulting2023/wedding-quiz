// host logic
const $ = (sel)=>document.querySelector(sel);
let realtime, channel, state = { phase: "idle" };
let room = "";
let answers = new Map(); // key: userId -> {name, choice, tSubmit, correct}
let scores = new Map();  // key: userId -> {name, points, avgMs, totalMs, count}

const QUESTIONS = [
  { text: "新郎の好きな飲み物は？", choices: ["コーヒー","緑茶","ビール","オレンジジュース"], correct: 2 },
  { text: "二人の初デートはどこ？", choices: ["映画館","水族館","動物園","カフェ"], correct: 1 },
  { text: "プロポーズの場所は？", choices: ["公園","レストラン","自宅","旅行先"], correct: 3 }
];

function uid(){ return Math.random().toString(36).slice(2,10); }

function pushState() {
  channel.publish("state", state);
}

function connect() {
  realtime = WQ.initAbly(WQ_CONFIG.ABLY_KEY);
  room = ($("#room").value || WQ_CONFIG.DEFAULT_ROOM || "RYOTA-WED").trim();
  channel = WQ.roomChannel(realtime, room);
  $("#status").textContent = `room: ${room}`;
  channel.subscribe("answer", onAnswer);
  $("#connectBox").style.display = "none";
  $("#host").style.display = "block";
  render();
}

function onAnswer(msg) {
  if (state.phase !== "question") return;
  const a = msg.data;
  if (answers.has(a.userId)) return;
  const ms = a.tSubmit - (state.startedAt || a.tSubmit);
  const correct = a.choice === state.question.correct;
  answers.set(a.userId, { ...a, ms, correct });
  // Update live stats if needed
  renderStats();
}

function startQuestion() {
  const i = parseInt($("#qindex").value, 10) || 0;
  const q = QUESTIONS[i];
  answers.clear();
  state = { phase: "question", questionIndex: i, question: q, startedAt: Date.now() };
  pushState();
  render();
}

function closeQuestion() {
  if (state.phase !== "question") return;
  state.phase = "results";
  // scoring
  const arr = Array.from(answers.values());
  arr.sort((a,b)=>{
    // correct first, then faster
    if (a.correct !== b.correct) return a.correct ? -1 : 1;
    return a.ms - b.ms;
  });
  // update totals
  for (const a of arr) {
    const prev = scores.get(a.userId) || { name: a.name, points: 0, totalMs: 0, count: 0 };
    if (a.correct) prev.points += 1;
    prev.totalMs += a.ms;
    prev.count += 1;
    prev.avgMs = Math.round(prev.totalMs / prev.count);
    scores.set(a.userId, prev);
  }
  // broadcast a minimal results payload
  const results = arr.slice(0, 10).map(x => ({ name: x.name, correct: x.correct, ms: x.ms }));
  channel.publish("results", { questionIndex: state.questionIndex, results });
  pushState();
  render();
}

function nextQuestion() {
  state = { phase: "idle" };
  pushState();
  render();
}

function showLeaderboard() {
  const arr = Array.from(scores.entries()).map(([userId, v]) => ({ userId, ...v }));
  arr.sort((a,b)=>{
    if (b.points !== a.points) return b.points - a.points; // higher points first
    return a.avgMs - b.avgMs; // faster avg first
  });
  const top = arr.slice(0, 10);
  channel.publish("leaderboard", { top });
  $("#leaderboardPreview").innerHTML = top.map((r,i)=>`<div class="leader"><div>${i+1}. ${r.name}</div><div>${r.points}pt / ${r.avgMs||0}ms</div></div>`).join("");
}

function render() {
  if (state.phase === "question") {
    $("#phase").textContent = "出題中";
    $("#curq").textContent = `${state.questionIndex+1}. ${state.question.text}`;
    $("#choices").innerHTML = state.question.choices.map((c,i)=>`<div>${i+1}. ${c}</div>`).join("");
  } else if (state.phase === "results") {
    $("#phase").textContent = "結果表示";
  } else {
    $("#phase").textContent = "待機";
    $("#curq").textContent = "-";
    $("#choices").innerHTML = "";
  }
  renderStats();
}

function renderStats() {
  const total = answers.size;
  const correct = Array.from(answers.values()).filter(a=>a.correct).length;
  $("#stats").textContent = `回答 ${total} / 正解 ${correct}`;
}

document.addEventListener("DOMContentLoaded", ()=>{
  $("#host").style.display = "none";
  $("#connectBtn").addEventListener("click", connect);
  $("#startBtn").addEventListener("click", startQuestion);
  $("#closeBtn").addEventListener("click", closeQuestion);
  $("#nextBtn").addEventListener("click", nextQuestion);
  $("#showLbBtn").addEventListener("click", showLeaderboard);
});
