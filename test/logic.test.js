import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { rule, folderOf, stopsOf, nextStop, leadsByTab, tabName, sessionName, lastPart } from "../mods/herdr-spaces-navigation/logic.js";

describe("rule", () => {
  test("~ is any home, * one folder name, and everything under the match", () => {
    const r = rule("~/code/client-*");
    assert.ok(r.test("/Users/ann/code/client-a"));
    assert.ok(r.test("/home/bob/code/client-b/api"));
    assert.ok(r.test("/root/code/client-c"));
    assert.ok(!r.test("/Users/ann/code/client"));
    assert.ok(!r.test("/srv/Users/ann/code/client-a"), "a path rule starts at the root");
  });

  test("* stays inside one folder name", () => {
    assert.ok(!rule("~/code/*/api").test("/Users/ann/code/a/b/api"));
    assert.ok(rule("~/code/*/api").test("/Users/ann/code/a/api"));
  });

  test("a bare name matches a whole folder name at any depth", () => {
    const r = rule("wbso-ai");
    assert.ok(r.test("/Users/ann/work/wbso-ai"));
    assert.ok(r.test("/wbso-ai/src"));
    assert.ok(!r.test("/Users/ann/work/wbso-ai-old"));
    assert.ok(!r.test("/Users/ann/work/my-wbso-ai"));
  });

  test("a trailing slash changes nothing; dots are literal; empty is no rule", () => {
    assert.ok(rule("/srv/app/").test("/srv/app"));
    assert.ok(!rule("a.b").test("/x/axb"));
    assert.equal(rule("  "), null);
  });
});

describe("folderOf", () => {
  const list = [
    { id: "code", match: "~/code" },
    { id: "client", match: "~/code/client" },
    { id: "also-code", match: "~/code" },
  ];
  const space = (id, cwd, extra = {}) => ({ id, folder: "/Users/ann", tabs: [{ id: `t-${id}` }], ...extra, _cwd: cwd });
  const panesOf = (...ss) => ss.map((s) => ({ tab: `t-${s.id}`, cwd: s._cwd }));

  test("the deepest rule wins, whatever the folders' order", () => {
    const s = space("s", "/Users/ann/code/client/web");
    assert.equal(folderOf(s, { list, of: {} }, panesOf(s)), "client");
    assert.equal(folderOf(s, { list: [...list].reverse(), of: {} }, panesOf(s)), "client");
  });

  test("on a tie the first folder wins", () => {
    const s = space("s", "/Users/ann/code/other");
    assert.equal(folderOf(s, { list, of: {} }, panesOf(s)), "code");
  });

  test("where it was dragged beats the rules; dragged out stays out", () => {
    const s = space("s", "/Users/ann/code/client");
    assert.equal(folderOf(s, { list, of: { s: "also-code" } }, panesOf(s)), "also-code");
    assert.equal(folderOf(s, { list, of: { s: "" } }, panesOf(s)), null);
  });

  test("dragged into a folder that's gone: in none", () => {
    const s = space("s", "/Users/ann/code/client");
    assert.equal(folderOf(s, { list, of: { s: "deleted" } }, panesOf(s)), null);
  });

  test("goes by the first terminal's live folder, else where the space was made", () => {
    const s = space("s", null, { folder: "/Users/ann/code/client" });
    assert.equal(folderOf(s, { list, of: {} }, panesOf(s)), "client");
    const away = space("s", "/tmp");
    assert.equal(folderOf(away, { list, of: {} }, panesOf(away)), null);
  });

  test("a remote space is filed by the id its own machine knows", () => {
    const s = space("vm/sp1", "/home/x", { machine: "vm" });
    assert.equal(folderOf(s, { list, of: { sp1: "client" } }, panesOf(s)), "client");
  });
});

describe("next/previous stops", () => {
  const tab = (id, active = false) => ({ id, active });
  const A = { id: "A", tabs: [tab("a1", true), tab("a2")] };
  const B = { id: "B", tabs: [tab("b1", true), tab("b2")] };
  const C = { id: "C", tabs: [tab("c1", true)] };
  const D = { id: "D", tabs: [tab("d1", true)] };
  // A's tabs show, B's tabs are folded, C is in a folded folder, D's tab shows.
  const seen = [...stopsOf(A, true, true), ...stopsOf(B, false, true), ...stopsOf(C, true, false), ...stopsOf(D, true, true)];
  const at = (space, tabId) => ({ ...space, tabs: space.tabs.map((c) => ({ ...c, active: c.id === tabId })) });
  const go = (space, tabId, dir) => {
    const s = nextStop(seen, at(space, tabId), dir);
    return s && (s.tab ?? s.id);
  };

  test("a space whose tabs show is a stop per tab; a folded one is one stop", () => {
    assert.deepEqual(stopsOf(A, true, true).map((s) => s.tab), ["a1", "a2"]);
    assert.deepEqual(stopsOf(B, false, true), [{ id: "B", tab: null, shown: true }]);
  });

  test("down goes tab by tab, then to the next space, past ones folded away, round to the top", () => {
    assert.equal(go(A, "a1", 1), "a2");
    assert.equal(go(A, "a2", 1), "B");
    assert.equal(go(B, "b2", 1), "d1");
    assert.equal(go(D, "d1", 1), "a1");
  });

  test("up goes the other way, round from the top to the end", () => {
    assert.equal(go(A, "a1", -1), "d1");
    assert.equal(go(D, "d1", -1), "B");
    assert.equal(go(B, "b1", -1), "a2");
  });

  test("from a space folded away, it steps from where that space is", () => {
    assert.equal(go(C, "c1", 1), "d1");
    assert.equal(go(C, "c1", -1), "B");
  });

  test("a tab in front the list doesn't know: from its space's first stop", () => {
    const odd = { id: "A", tabs: [tab("a1"), tab("a2"), tab("a3", true)] };
    assert.equal(nextStop(seen, odd, 1).tab, "a2");
  });

  test("no space in front: down starts at the top, up at the end", () => {
    assert.equal(nextStop(seen, undefined, 1).tab, "a1");
    assert.equal(nextStop(seen, undefined, -1).tab, "d1");
  });

  test("nothing to go to", () => {
    assert.equal(nextStop([], A, 1), null);
    assert.equal(nextStop(stopsOf(C, true, false), C, 1), null);
  });
});

describe("tab rows", () => {
  const zsh = { key: "shell", name: "zsh", agent: false };
  const claude = { key: "claude", name: "Claude Code", agent: true };
  const omp = { key: "omp", name: "Oh My Pi", agent: true };

  test("a tab goes by its agent's pane, else by its first pane", () => {
    const by = leadsByTab([
      { tab: "t1", pane: "a", program: zsh },
      { tab: "t1", pane: "b", program: claude },
      { tab: "t2", pane: "c", program: zsh },
      { tab: "t2", pane: "d", program: { name: "nvim", agent: false } },
      { tab: "t3", pane: "e", program: null },
    ]);
    assert.equal(by.t1.pane, "b");
    assert.equal(by.t2.pane, "c");
    assert.equal(by.t3, undefined);
  });

  test("a named tab shows its name; an unnamed one its program, else Terminal", () => {
    assert.equal(tabName({ named: true, name: "tests" }, claude), "tests");
    assert.equal(tabName({ named: false, name: "2" }, claude), "Claude Code");
    assert.equal(tabName({ named: false, name: "2" }, undefined), "Terminal");
  });

  test("an agent's session name is its title without the leading marks", () => {
    assert.equal(sessionName({ program: omp, title: "π ⠸ 🏷️ TAB: Auto-name tabs" }), "TAB: Auto-name tabs");
    assert.equal(sessionName({ program: omp, title: "π > 📝 KEP1: Fill the form" }), "KEP1: Fill the form");
    assert.equal(sessionName({ program: claude, title: "✳ Writing a mod" }), "Writing a mod");
    assert.equal(sessionName({ program: claude, title: "Writing a mod" }), "Writing a mod");
  });

  test("no session name for a shell, a path, a user@host or the program's own name", () => {
    assert.equal(sessionName({ program: zsh, title: "Fix the build" }), "");
    assert.equal(sessionName({ program: claude, title: "✳ Claude Code" }), "");
    assert.equal(sessionName({ program: omp, title: "π" }), "");
    assert.equal(sessionName({ program: omp, title: "omp" }), "");
    assert.equal(sessionName({ program: claude, title: "~/code/app" }), "");
    assert.equal(sessionName({ program: claude, title: "ann@box:~/code" }), "");
    assert.equal(sessionName(undefined), "");
  });
});

describe("lastPart", () => {
  test("a folder's name follows the start folder's last part", () => {
    assert.equal(lastPart("~/Projects/herdr/"), "herdr");
    assert.equal(lastPart("/srv/app"), "app");
    assert.equal(lastPart("~"), "");
    assert.equal(lastPart("/"), "");
  });
});
