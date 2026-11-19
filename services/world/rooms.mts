import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import type { Store } from "./database.mts";
import { secret } from "./database.mts";
import {
  advance,
  generateChunk,
  type Entity,
  type Peer,
  type Specification,
} from "../../engine/world.ts";
import { z } from "zod";
type Client = {
  socket: WebSocket;
  peer: Peer;
  dx: number;
  dz: number;
  run: boolean;
  last: number;
  world: string;
  hidden: Set<string>;
  tokens: number;
};
type Room = {
  clients: Map<string, Client>;
  seed: number;
  spec: Specification;
  version: number;
  changes: Entity[];
  cache: Map<string, Entity[]>;
};
export function multiplayer(
  server: Server,
  store: Store,
  allowed: Set<string>,
) {
  const rooms = new Map<string, Room>(),
    tickets = new Map<
      string,
      { guest: string; world: string; expires: number }
    >();
  const wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });
  let tick = 0;
  let closing = false;
  const saves = new Set<Promise<unknown>>();
  function save(c: Client) {
    const p = store.db.query(
      "INSERT INTO occupants(world_id,guest_id,x,z) VALUES($1,$2,$3,$4) ON CONFLICT(world_id,guest_id) DO UPDATE SET x=excluded.x,z=excluded.z,updated_at=now()",
      [c.world, c.peer.id, c.peer.x, c.peer.z],
    );
    saves.add(p);
    p.catch(() => console.error("Position checkpoint failed")).finally(() =>
      saves.delete(p),
    );
  }
  function detach(c: Client) {
    const r = rooms.get(c.world);
    if (r?.clients.get(c.peer.id) !== c) return;
    r.clients.delete(c.peer.id);
    save(c);
    if (!r.clients.size) rooms.delete(c.world);
  }
  const inputSchema = z
    .object({
      type: z.literal("input"),
      dx: z.number().min(-1).max(1),
      dz: z.number().min(-1).max(1),
      run: z.boolean(),
    })
    .strict();
  server.on("upgrade", (req, socket, head) => {
    if (
      closing ||
      req.url !== "/live" ||
      !allowed.has(req.headers.origin ?? "") ||
      wss.clients.size >= 64
    ) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
  });
  wss.on("connection", (ws) => {
    let client: Client | undefined,
      joining = false;
    const timeout = setTimeout(() => ws.close(1008, "Join timeout"), 5000);
    ws.on("message", async (bytes) => {
      try {
        const msg = JSON.parse(bytes.toString());
        if (!client) {
          if (joining || msg.type !== "join" || typeof msg.ticket !== "string")
            throw Error();
          joining = true;
          const t = tickets.get(msg.ticket);
          tickets.delete(msg.ticket);
          if (!t || t.expires < Date.now()) throw Error();
          const [world, pos, blocked, mods] = await Promise.all([
            store.db.query(
              "SELECT w.*,a.look FROM worlds w JOIN membership m ON m.world_id=w.id LEFT JOIN avatars a ON a.guest_id=m.guest_id WHERE w.id=$1 AND m.guest_id=$2",
              [t.world, t.guest],
            ),
            store.db.query(
              "SELECT x,z FROM occupants WHERE world_id=$1 AND guest_id=$2",
              [t.world, t.guest],
            ),
            store.db.query(
              "SELECT actor,target FROM blocks WHERE actor=$1 OR target=$1",
              [t.guest],
            ),
            store.db.query(
              "SELECT entity FROM modifications WHERE world_id=$1",
              [t.world],
            ),
          ]);
          if (!world.rowCount || ws.readyState !== WebSocket.OPEN)
            throw Error();
          let r = rooms.get(t.world);
          if (!r) {
            const w = world.rows[0];
            r = {
              clients: new Map(),
              seed: w.seed,
              spec: w.spec,
              version: w.revision,
              changes: mods.rows.map((m) => m.entity),
              cache: new Map(),
            };
            rooms.set(t.world, r);
          }
          const old = r.clients.get(t.guest);
          if (!old && r.clients.size >= 16) throw Error();
          const p = old?.peer ?? pos.rows[0] ?? { x: 0, z: 0 };
          if (old) old.socket.close(4000, "Session resumed elsewhere");
          client = {
            socket: ws,
            peer: {
              look: world.rows[0].look ?? undefined,
              id: t.guest,
              x: p.x,
              z: p.z,
              heading: 0,
              moving: false,
            },
            dx: 0,
            dz: 0,
            run: false,
            last: 0,
            world: t.world,
            hidden: new Set(
              blocked.rows.map((b) =>
                b.actor === t.guest ? b.target : b.actor,
              ),
            ),
            tokens: 25,
          };
          r.clients.set(t.guest, client);
          clearTimeout(timeout);
          ws.send(
            JSON.stringify({
              type: "welcome",
              id: t.guest,
              world: t.world,
              x: p.x,
              z: p.z,
            }),
          );
          return;
        }
        if (client.tokens-- < 1) throw Error();
        const m = inputSchema.parse(msg);
        client.dx = m.dx;
        client.dz = m.dz;
        client.run = m.run;
        client.last = Date.now();
      } catch {
        ws.close(1008, "Invalid session or input");
      }
    });
    ws.on("error", () => {});
    ws.on("close", () => {
      clearTimeout(timeout);
      if (client) detach(client);
    });
  });
  const interval = setInterval(() => {
    tick++;
    const now = Date.now();
    for (const [key, t] of tickets) if (t.expires < now) tickets.delete(key);
    for (const r of rooms.values()) {
      for (const c of r.clients.values()) {
        c.tokens = Math.min(25, c.tokens + 2);
        if (now - c.last > 550) c.dx = c.dz = 0;
        const cx = Math.floor(c.peer.x / 32),
          cz = Math.floor(c.peer.z / 32),
          key = cx + "," + cz;
        let entities = r.cache.get(key);
        if (!entities) {
          entities = [];
          for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++)
              entities.push(
                ...generateChunk(r.seed, r.spec, cx + i, cz + j).entities,
              );
          if (r.cache.size >= 48) r.cache.delete(r.cache.keys().next().value!);
          r.cache.set(key, entities);
        }
        const p = advance(
          c.peer,
          c.dx,
          c.dz,
          c.run,
          0.1,
          entities.concat(r.changes),
        );
        c.peer.moving = Math.hypot(p.x - c.peer.x, p.z - c.peer.z) > 0.004;
        if (c.peer.moving) c.peer.heading = Math.atan2(c.dx, c.dz);
        Object.assign(c.peer, p);
        if (tick % 20 === 0) save(c);
      }
      for (const c of r.clients.values()) {
        if (
          c.socket.readyState !== WebSocket.OPEN ||
          c.socket.bufferedAmount > 65536
        )
          continue;
        const peers = Array.from(r.clients.values())
          .filter(
            (o) =>
              !c.hidden.has(o.peer.id) &&
              Math.hypot(o.peer.x - c.peer.x, o.peer.z - c.peer.z) < 64,
          )
          .map((o) => o.peer);
        c.socket.send(
          JSON.stringify({ type: "state", peers, version: r.version, tick }),
        );
      }
    }
  }, 100);
  return {
    ticket(guest: string, world: string) {
      for (const [k, v] of tickets)
        if (v.guest === guest && v.world === world) tickets.delete(k);
      const key = secret();
      tickets.set(key, { guest, world, expires: Date.now() + 20000 });
      return key;
    },
    position: (w: string, g: string) => rooms.get(w)?.clients.get(g)?.peer,
    changed(w: string, version: number, e: Entity) {
      const r = rooms.get(w);
      if (r) {
        r.version = version;
        r.changes = r.changes.filter((x) => x.id !== e.id).concat(e);
      }
    },
    block(a: string, b: string) {
      for (const r of rooms.values()) {
        r.clients.get(a)?.hidden.add(b);
        r.clients.get(b)?.hidden.add(a);
      }
    },
    async close() {
      closing = true;
      clearInterval(interval);
      for (const r of rooms.values())
        for (const c of [...r.clients.values()]) {
          detach(c);
          c.socket.terminate();
        }
      for (const w of wss.clients) w.terminate();
      await Promise.allSettled(saves);
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    },
  };
}
