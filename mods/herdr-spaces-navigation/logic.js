// The sidebar's decisions that need no app to run: which folder a space goes
// in, which stop the next/previous keys go to, what a tab row is called.
// main.js draws with them; test/ checks them with `node --test`.

// A space's id as its own machine knows it ("vm/sp1" is "sp1" on vm).
export const localId = (s) => (s.machine ? s.id.slice(s.machine.length + 1) : s.id);

// Where a space is now: its first terminal's live folder, else where it was made.
// `ps`: panes(), read once by the caller (each read copies every pane).
export function place(s, ps) {
  const tabs = new Set((s.tabs ?? []).map((c) => c.id));
  return ps.find((p) => tabs.has(p.tab) && p.cwd)?.cwd || s.folder;
}

// A rule of "Collect spaces from" takes a folder and everything in it. "~" is
// any home, "*" any one folder name, and a rule starting with neither "/" nor
// "~" is a folder name at any depth ("wbso-ai").
export function rule(pattern) {
  const p = pattern.trim().replace(/\/+$/, "");
  if (!p) return null;
  const body = p.replace(/^~/, "\u0000").split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")
    .replace("\u0000", "(?:/home/[^/]+|/Users/[^/]+|/root)");
  return new RegExp(`${/^[/~]/.test(p) ? "^" : "(?:^|/)"}${body}(?:/|$)`);
}

export const collects = (f, path) => Boolean(path) && (f.match ?? "").split(",").some((p) => rule(p)?.test(path));

// How deep into the path a folder's rules reach: 0 when none match. A rule
// that takes ~/code/client wins over one that takes ~/code; a bare "*" reaches
// least (it matches the first slash) but still counts.
const reach = (f, path) => !path ? 0 : Math.max(0, ...(f.match ?? "").split(",").map((p) => {
  const m = rule(p)?.exec(path);
  return m ? 1 + m.index + m[0].replace(/\/$/, "").length : 0;
}));

// The folder whose rules reach deepest; the first one on a tie.
function deepest(list, score) {
  let best = null, most = 0;
  for (const f of list) { const n = score(f); if (n > most) { best = f; most = n; } }
  return best?.id ?? null;
}

// Where a space goes: where it was dragged (or "" for out of every folder), else
// the folder whose rules reach deepest into the folder it works in.
export function folderOf(s, { list, of }, ps) {
  const id = of[localId(s)];
  if (id !== undefined) return list.some((f) => f.id === id) ? id : null;
  return deepest(list, (f) => reach(f, place(s, ps)));
}

// A path's last folder name: "~/Projects/herdr/" gives "herdr"; "~" or "/" give "".
export const lastPart = (p) => {
  const part = p.trim().replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
  return part === "~" ? "" : part;
};

// A space's stops for the next/previous keys: one per tab while its tab rows
// show, else the space itself. `shown`: false when it's folded away.
export function stopsOf(w, tabsShow, shown) {
  const tabs = tabsShow ? w.tabs ?? [] : [];
  return tabs.length ? tabs.map((c) => ({ id: w.id, tab: c.id, shown })) : [{ id: w.id, tab: null, shown }];
}

// The stop one down (1) or up (-1) from the tab in front of `space`, past the
// ones folded away, round from the end to the top; null when none shows.
// From a space folded away, it steps from where that space would be.
export function nextStop(seen, space, dir) {
  const len = seen.length;
  if (!len) return null;
  const tab = space?.tabs?.find((c) => c.active)?.id;
  let at = seen.findIndex((s) => s.id === space?.id && (s.tab === null || s.tab === tab));
  if (at < 0) at = seen.findIndex((s) => s.id === space?.id);
  const from = at >= 0 ? at : dir > 0 ? -1 : len;
  for (let n = 1; n <= len; n++) {
    const s = seen[(((from + dir * n) % len) + len) % len];
    if (s.shown) return s;
  }
  return null;
}

// tab id -> the pane it goes by: an agent's first, else its first pane.
export function leadsByTab(ps) {
  const out = {};
  for (const p of ps) {
    if (!p.tab || !p.program) continue;
    if (!out[p.tab] || (p.program.agent && !out[p.tab].program.agent)) out[p.tab] = p;
  }
  return out;
}

// A tab row's name: its own when someone named it, else its program's, as the tab bar does.
export const tabName = (c, program) => (c.named ? c.name : program?.name ?? "Terminal");

// An agent's session name, from the title it gives its terminal: "π ⠸ 🏷️ TAB: Name
// tabs" gives "TAB: Name tabs", "✳ Fix the build" gives "Fix the build". Leading
// marks (spinners, emoji, Oh My Pi's "π") go. "" for a pane that isn't an agent,
// and for a title that is only a path, a user@host or the program's own name.
export function sessionName(p) {
  const program = p?.program;
  if (!program?.agent) return "";
  const s = (p.title ?? "").replace(/^(?:[^\p{L}\p{N}~/\\]|π(?=\s|$))+/u, "").trim();
  if (!s || /^[~/]|^[A-Za-z]:\\/.test(s) || s.includes("@")) return "";
  return [program.name, program.key].some((n) => n && n.toLowerCase() === s.toLowerCase()) ? "" : s;
}
