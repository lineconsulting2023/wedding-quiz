// join logic
const $ = (sel)=>document.querySelector(sel);
let realtime, channel, state = { phase: "idle" };
let room = "", userId = "", name = "";
let answeredFor = new Set();

function uid(){ return Math.random().toString(36).slice(2,10); }

function log(s){ console.log("[join]", s); }

function connect() {
  realtime = WQ.initAbly(WQ_CONFIG.ABLY_KEY);
  room = ($("#room").value || WQ_CONFIG.DEFAULT_ROOM || "RYOTA-WED").trim();
  name = ($("#name").value || "ゲスト").trim().slice(0,16);
  userId = uid();
  channel = WQ.roomChannel(realtime, room);
  $("#status").textContent = `入室しました（room: ${room})`;
  channel.subscribe("state", onState);
  channel.subscribe("nudge", ()=>{
    // host can ping to re-sync
    channel.history((err, res)=>{
      // no-op
    });
  });
  $("#joinBox").style.display = "none";
  $("#quiz").style.display = "block";
}

function onState(msg) {
  state = msg.data;
  render();
}

function answer(i) {
  if (state.phase !== "question") return;
  if (answeredFor.has(state.questionIndex)) return;
  const payload = {
    type: "answer",
    userId, name, choice: i,
    questionIndex: state.questionIndex,
    tSubmit: Date.now()
  };
  channel.publish("answer", payload);
  answeredFor.add(state.questionIndex);
  $("#answered").textContent = "回答しました！";
}

function render() {
  $("#phase").textContent = state.phase;
  if (state.phase === "question") {
    $("#qtext").textContent = state.question.text;
    const choices = state.question.choices || [];
    choices.forEach((c, i)=>{
      const b = $("#c" + i);
      b.textContent = c;
      b.disabled = false;
      b.style.opacity = "1";
    });
    $("#answered").textContent = answeredFor.has(state.questionIndex) ? "回答済み" : "";
  } else {
    // disable
    for (let i=0;i<4;i++){ const b=$("#c"+i); b.disabled=true; b.style.opacity="0.6"; }
    if (state.phase === "results") {
      $("#qtext").textContent = "結果発表中…";
    } else if (state.phase === "idle") {
      $("#qtext").textContent = "次の問題を待っています…";
    }
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  $("#quiz").style.display = "none";
  $("#joinBtn").addEventListener("click", connect);
  for (let i=0;i<4;i++){ $("#c"+i).addEventListener("click", ()=>answer(i)); }
});
