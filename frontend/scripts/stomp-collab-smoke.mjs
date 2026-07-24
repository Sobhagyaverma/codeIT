import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const BASE = process.env.BASE || "http://localhost:9091";

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: email, password }),
  });
  if (!res.ok) throw new Error(`login failed ${res.status}`);
  return res.json();
}

async function register(name, uniqueUserId, email, password) {
  await fetch(`${BASE}/api/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, uniqueUserId, email, password }),
  });
}

function connectStomp(token) {
  return new Promise((resolve, reject) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: () => {},
      onConnect: () => resolve(client),
      onStompError: (f) => reject(new Error(f.headers["message"] || "stomp error")),
      onWebSocketError: (e) => reject(e),
    });
    client.activate();
    setTimeout(() => reject(new Error("connect timeout")), 10000);
  });
}

function connectStompExpectFail() {
  return new Promise((resolve) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE}/ws`),
      connectHeaders: {},
      debug: () => {},
      onConnect: () => {
        client.deactivate();
        resolve({ ok: false, reason: "connected without JWT" });
      },
      onStompError: () => resolve({ ok: true, reason: "stomp error as expected" }),
      onWebSocketClose: () => resolve({ ok: true, reason: "closed without auth" }),
    });
    client.activate();
    setTimeout(() => {
      client.deactivate();
      resolve({ ok: true, reason: "timeout/no connect (fail-closed)" });
    }, 4000);
  });
}

async function main() {
  const ts = Date.now();
  const hostEmail = `stomp_host_${ts}@test.com`;
  const guestEmail = `stomp_guest_${ts}@test.com`;
  const pass = "testpass123";

  await register("StompHost", `stomphost${ts}`, hostEmail, pass);
  await register("StompGuest", `stompguest${ts}`, guestEmail, pass);
  const host = await login(hostEmail, pass);
  const guest = await login(guestEmail, pass);

  const createRes = await fetch(`${BASE}/api/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${host.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "CODEROOM", language: "java" }),
  });
  const room = await createRes.json();
  if (!createRes.ok) throw new Error(`create room ${createRes.status} ${JSON.stringify(room)}`);

  const joinRes = await fetch(`${BASE}/api/rooms/join/${room.inviteToken}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${guest.token}` },
  });
  if (!joinRes.ok) throw new Error(`join failed ${joinRes.status}`);

  const unauth = await connectStompExpectFail();
  if (!unauth.ok) throw new Error(unauth.reason);
  console.log("PASS unauth STOMP blocked:", unauth.reason);

  const hostClient = await connectStomp(host.token);
  console.log("PASS host STOMP connected");
  const guestClient = await connectStomp(guest.token);
  console.log("PASS guest STOMP connected");

  const chatTopic = `/topic/rooms/${room.id}/chat`;
  const presenceTopic = `/topic/rooms/${room.id}/presence`;

  const chatPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("chat timeout")), 8000);
    guestClient.subscribe(chatTopic, (msg) => {
      clearTimeout(t);
      resolve(JSON.parse(msg.body));
    });
  });

  const presencePromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("presence timeout")), 8000);
    guestClient.subscribe(presenceTopic, (msg) => {
      const body = JSON.parse(msg.body);
      if (body.type === "JOINED" && body.userId === host.userId) {
        clearTimeout(t);
        resolve(body);
      }
    });
  });

  await new Promise((r) => setTimeout(r, 400));

  hostClient.publish({
    destination: `/app/rooms/${room.id}/presence/join`,
    body: "{}",
    headers: { "content-type": "application/json" },
  });

  const presence = await presencePromise;
  console.log("PASS presence JOINED:", JSON.stringify(presence));

  const sendRes = await fetch(`${BASE}/api/rooms/${room.id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${host.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: "live hello" }),
  });
  const sent = await sendRes.json();
  if (!sendRes.ok) throw new Error(`send ${sendRes.status} ${JSON.stringify(sent)}`);

  const chat = await chatPromise;
  console.log("PASS live chat:", JSON.stringify(chat));
  if (chat.content !== "live hello") throw new Error("chat content mismatch");
  if (chat.id !== sent.id) throw new Error("chat id mismatch");

  await hostClient.deactivate();
  await guestClient.deactivate();
  console.log("SUMMARY: Task 5 STOMP tests PASSED");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
