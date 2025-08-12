// screen logic
const $ = (sel)=>document.querySelector(sel);
let realtime, channel, state = { phase: "idle" };
let room = "";

function connect() {
  realtime = WQ.initAbly(WQ_CONFIG.ABLY_KEY);
  room = ($("#room").value || WQ_CONFIG.DEFAULT_ROOM || "RYOTA-WED").trim();
  channel = WQ.roomChannel(realtime, room);
  $("#status").textContent = `room: ${room}`;
  channel.subscribe("state", onState);
  channel.subscribe("results", onResults);
  channel.subscribe("leaderboard", onLeaderboard);
  $("#connectBox").style.display = "none";
  $("#screen").style.display = "block";
}

function onState(msg) {
  state = msg.data;
  render();
}

function onResults(msg) {
  const res = msg.data;
  $("#results").innerHTML = res.results.map((r,i)=>{
    const mark = r.correct ? "✅" : "❌";
    return `<div class="leader"><div>${i+1}. ${r.name}</div><div>${mark} ${r.ms}ms</div></div>`;
  }).join("");
}

function onLeaderboard(msg) {
  const top = msg.data.top || [];
  $("#leaderboard").innerHTML = top.map((r,i)=>{
    return `<div class="leader"><div>${i+1}. ${r.name}</div><div>${r.points}pt / ${r.avgMs||0}ms</div></div>`;
  }).join("");
}

function render() {
  if (state.phase === "question") {
    $("#phase").textContent = "出題中";
    $("#qtext").textContent = `${state.questionIndex+1}. ${state.question.text}`;
    $("#choices").innerHTML = state.question.choices.map((c,i)=>`<div>${i+1}. ${c}</div>`).join("");
  } else if (state.phase === "results") {
    $("#phase").textContent = "結果表示";
  } else {
    $("#phase").textContent = "待機";
    $("#qtext").textContent = "次の問題を待っています…";
    $("#choices").innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  $("#screen").style.display = "none";
  $("#connectBtn").addEventListener("click", connect);
});
