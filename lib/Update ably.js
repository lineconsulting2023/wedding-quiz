import * as Ably from 'ably';

let client;

export function getAbly() {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (!key) throw new Error('NEXT_PUBLIC_ABLY_KEY が設定されていません');
    client = new Ably.Realtime.Promise({ key, echoMessages: false });
  }
  return client;
}

export function channel(room) {
  return getAbly().channels.get(`room:${room}`);
}
