// lib/ably.js
(function() {
  function initAbly(key) {
    if (!key || key.includes("REPLACE_WITH")) {
      alert("Please set your Ably Public API Key in config.js");
    }
    const realtime = new Ably.Realtime({ key, echoMessages: false });
    return realtime;
  }

  function roomChannel(realtime, room) {
    const name = "room-" + room;
    return realtime.channels.get(name);
  }

  window.WQ = window.WQ || {};
  window.WQ.initAbly = initAbly;
  window.WQ.roomChannel = roomChannel;
})();
