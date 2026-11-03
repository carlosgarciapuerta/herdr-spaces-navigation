# Herdr Spaces Navigation

The spaces list of the [Herdr](https://herdr.dev) desktop app with folders **and tabs**: each space's tabs hang under it, so one sidebar shows folders, spaces and tabs together.

A fork of [jankeesvw/herdr-space-folders](https://github.com/jankeesvw/herdr-space-folders). Everything that mod does stays; this fork adds the tab rows.

## Tabs under each space

- **One row per tab**, indented under its space: the program's icon, the tab's name (an unnamed tab goes by its program, as in the tab bar), and its agent status: a spinner while working, a dot when done or blocked.
- **Click** a tab row to show that space and that tab (`tab.select`).
- **Double-click** a tab row to rename it (`tab.rename`).
- **Right-click** a tab row for Herdr's own tab menu (rename, close, ...).
- **A chevron on each space** folds its tabs away. This screen remembers it.
- In the narrow rail (sidebar under 160px), no tab rows show.

## Folders (from space-folders)

- Colored folders that fold, filled by dragging or by rules on the folder a space works in.
- A folder's **+** opens a new space in the folder's start folder.
- A folder can take in another machine, with its header and spaces.
- `alt-up` / `alt-down` go to the tab above or below in the list as it shows: through the tabs of a space, then on to the next space or folder.
- Folders are kept in `~/.config/herdr-space-folders.json` on the machine the spaces run on. This is the same file (and the same shared state) as space-folders, so both mods show the same folders.

See [RECIPE.md](RECIPE.md) for the full behavior.

## Install

Clone this repository and link the mod into Herdr's home:

```sh
git clone https://github.com/carlosgarciapuerta/herdr-spaces-navigation.git ~/workspace/personal/herdr-spaces-navigation
ln -s ~/workspace/personal/herdr-spaces-navigation/mods/herdr-spaces-navigation ~/.config/herdr-app/mods/herdr-spaces-navigation
cp ~/workspace/personal/herdr-spaces-navigation/layouts/main-navigation.json ~/.config/herdr-app/layouts/
herdr-app do layout.switch --name main-navigation
```

`main-navigation` is Herdr's own `main` layout (0.1.10) with the spaces list swapped for this one. `ctrl-shift-l` switches back to any other layout.

Then add the `layout:main-navigation` section of this repository's `keys.json` to `~/.config/herdr-app/keys.json`. Without it, `alt-up` and `alt-down` stay Herdr's own `space.prev` and `space.next`.

Herdr doesn't notice changes inside a symlinked mod folder, so after a `git pull` restart Herdr (or make the link again) to load the new version.

### Your own layout

In a layout of your own, point the spaces block at this mod:

```json
{ "id": "spaces", "type": "block", "size": { "weight": 1 }, "min": 90, "content": { "mod": "herdr-spaces-navigation" } }
```

and give `keys.json` the same keys in a section named after that layout, `layout:<name>`, with `herdr-spaces-navigation.next` and `herdr-spaces-navigation.prev`.

## Keeping up with upstream

```sh
git remote add upstream https://github.com/jankeesvw/herdr-space-folders.git   # once
git fetch upstream && git merge upstream/main
```

Upstream's mod lives in `mods/space-folders/`; here it is `mods/herdr-spaces-navigation/`. Git follows the rename, so most merges apply by themselves.

## License

MIT (`LICENSE`). The mod started as a copy of the spaces mod that ships with [Herdr](https://herdr.dev); that code keeps Herdr's Apache License 2.0 (`LICENSE-APACHE`).
