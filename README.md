# Herdr Spaces Navigation

A spaces sidebar for the [Herdr](https://herdr.dev) desktop app. It shows folders, spaces and tabs in one list: each space's tabs hang under it, and the keys step through them in the order you see.

It is a fork of [jankeesvw/herdr-space-folders](https://github.com/jankeesvw/herdr-space-folders). Everything that mod does stays. This fork adds tab rows, tab navigation and more colors.

## What it adds to space-folders

| | space-folders | herdr-spaces-navigation |
|---|---|---|
| Tabs in the sidebar | no | one row per tab, under its space |
| `alt-up` / `alt-down` | space to space | tab to tab, then the next space or folder |
| Space color | no menu | 14 colors in the space's right-click menu |
| Folder colors | 7 | 15 |

## Tabs under each space

- **One row per tab**, indented under its space: the program's icon, the tab's name (an unnamed tab goes by its program, as in the tab bar), and its agent status: a spinner while working, a dot when done or blocked.
- **Click** a tab row to show that space and that tab.
- **Double-click** a tab row to rename it.
- **Right-click** a tab row for Herdr's tab menu (rename, new tab, close).
- **The chevron on a space** folds its tabs away. This screen remembers it.
- In the narrow rail (sidebar under 160px), no tab rows show.

## Keys

`alt-down` and `alt-up` go to the next or previous tab in the list as it shows:

1. through the tabs of the space you are in,
2. then to the next space in the folder,
3. then to the next folder, then the spaces in no folder,
4. and from the end back to the top.

A space with folded tabs is one stop. Spaces in a folded folder are skipped.

## Colors

- **Right-click a space** to pick its color from 14. Below the colors are Herdr's own space items: Rename, New worktree, Open worktree, Remove worktree (in a worktree), Close.
- **Right-click a folder** to pick its color from 15 (grey and the same 14). Below the colors: New space here, Edit folder…, Delete folder.

## Folders (from space-folders)

- Colored folders that fold, filled by dragging or by rules on the folder a space works in (`wbso-ai`, `~/code/client-*`). The most specific rule wins.
- Drag a space onto a folder to file it, onto a space to put it there, or below the list to take it out. Drag folders to put them in order.
- A folder's **+** opens a new space in the folder's start folder.
- A folder can take in another machine, with its header and spaces.
- Folders are kept in `~/.config/herdr-space-folders.json` on the machine the spaces run on. This is the same file (and the same shared state) as space-folders, so both mods show the same folders.

See [RECIPE.md](RECIPE.md) for the full behavior.

## Install

Clone this repository and link the mod into Herdr's home:

```sh
git clone https://github.com/carlosgarciapuerta/herdr-spaces-navigation.git ~/workspace/personal/herdr-spaces-navigation
ln -s ~/workspace/personal/herdr-spaces-navigation/mods/herdr-spaces-navigation ~/.config/herdr-app/mods/herdr-spaces-navigation
```

Then do one of these:

- **Use the layout in this repository.** `main-navigation` is Herdr's own `main` layout (0.1.10) with the spaces list swapped for this one:

  ```sh
  cp ~/workspace/personal/herdr-spaces-navigation/layouts/main-navigation.json ~/.config/herdr-app/layouts/
  herdr-app do layout.switch --name main-navigation
  ```

  Add the `layout:main-navigation` section of this repository's `keys.json` to `~/.config/herdr-app/keys.json`.

- **Use your own layout.** Point its spaces block at this mod:

  ```json
  { "id": "spaces", "type": "block", "size": { "weight": 1 }, "min": 90, "content": { "mod": "herdr-spaces-navigation" } }
  ```

  In `~/.config/herdr-app/keys.json`, add a section named after that layout, `layout:<name>`, that binds `alt-down` to `herdr-spaces-navigation.next` and `alt-up` to `herdr-spaces-navigation.prev`.

Without the keys section, `alt-up` and `alt-down` stay Herdr's own `space.prev` and `space.next`. `ctrl-shift-l` switches to another layout.

Herdr doesn't notice changes inside a symlinked mod folder. After a `git pull`, restart Herdr (or make the link again) to load the new version.

## Keeping up with upstream

```sh
git remote add upstream https://github.com/jankeesvw/herdr-space-folders.git   # once
git fetch upstream && git merge upstream/main
```

Upstream's mod lives in `mods/space-folders/`; here it is `mods/herdr-spaces-navigation/`. Git follows the rename, so most merges apply by themselves.

## License

MIT (`LICENSE`), for herdr-space-folders by Jankees van Woezik and contributors and for this fork.

The mod started as a copy of the spaces mod that ships with [Herdr](https://herdr.dev). That code keeps Herdr's Apache License 2.0 (`LICENSE-APACHE`). `NOTICE` says where each part comes from and what changed.
