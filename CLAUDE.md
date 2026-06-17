# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BatchPrint Pro is a pure-frontend mail-merge batch printing application. Users import Excel data, drag fields onto a canvas with millimeter-level positioning, and print merged pages using the browser's print engine.

- No build step, no package manager, no test runner.
- All runtime dependencies are loaded from CDN (SheetJS for Excel parsing).
- Single-page application: `index.html` + `css/style.css` + `js/app.js`.

## Running the App

Open `index.html` directly in a browser, or serve the folder locally:

```bash
cd /Users/yanglijun/Desktop/game/BatchPrintPro
python3 -m http.server 8080
# Then open http://localhost:8080
```

Recommended browsers: Chrome / Edge, Safari, Firefox (in that order). Print rendering depends heavily on the browser's print engine and the fonts installed on the target system.

## Core Architecture

### Coordinate Systems

Two coordinate systems are in use at all times:

1. **Design-time / preview**: millimeters are converted to screen pixels using `BASE_MM_TO_PX` (3.7795..., 96dpi) multiplied by the current zoom ratio (`state.zoom`). Canvas rendering and field positions use this unit.
2. **Print-time**: millimeters are output as literal `mm` CSS values on generated `.print-page` elements. This avoids screen-DPI mapping errors.

The active zoom factor is stored in `state.zoom` and applied to `MM_TO_PX` via `setZoom()`. Rulers, canvas size, and field positions are redrawn whenever zoom or paper size changes.

### State Model

All mutable state lives in the `state` object in `js/app.js`:

- `paperWidth` / `paperHeight`: physical page size in mm.
- `bgImage`: base64-encoded background image, or `null`.
- `printBg`: whether the background image should appear in printed output.
- `fields[]`: array of field objects placed on the canvas. Each field stores `fieldName`, `x`, `y`, `width`, `font`, `size`, `color`, `align`, `vAlign`, `bold`.
- `excelData[]` / `excelHeaders[]`: parsed Excel content.
- `customFonts[]`: fonts manually added by the user beyond system scanning.
- `zoom`: current canvas display zoom.

`state` is snapshotted to `localStorage` under the key `batchPrint_snapshot` via `debouncedSave()`. `restoreFromStorage()` rebuilds the UI from that snapshot on page load.

### File Persistence

Two JSON file formats are supported:

- **Template** (`saveTemplate` / `loadTemplate`): paper + background + fields. Does not include Excel data or custom fonts. Loading a template calls `newProject(true)` first to guarantee a clean state.
- **Project** (`saveProject` / `loadProject`): template + Excel data + custom fonts. Identified by `type: 'project'`.

Both are self-contained JSON files; background images are embedded as base64.

### Rendering Pipeline

1. `renderField(field)` creates `.canvas-field` DOM nodes in `#fieldLayer` for design-time editing. Sample values come from the first Excel row.
2. `updateFieldElement(field)` re-applies position/style when a field or zoom changes.
3. `createPrintPage(row, forPrint)` builds per-page print/preview DOM. For print (`forPrint=true`), sizes are in `mm`; for preview, sizes use the current `MM_TO_PX`.
4. `executePrint()` injects/updates the `@page { size }` rule, appends all pages to `#printContainer`, waits for background images to decode, and calls `window.print()`. Cleanup happens on `afterprint` via `cleanupPrintPages()`.

### Vertical Alignment

Vertical alignment is implemented consistently in both canvas and print paths using flexbox (`display: flex; align-items: ...`) with a fixed line-height/height based on the field's point size. Do not re-introduce `transform: translateY()` for print alignment; it caused real-world position drift.

### Paper Size and @page

The dynamic `@page { size: ...; margin: 0; }` rule is maintained in a `<style id="dynamic-print-size" media="print">` element. It is updated immediately whenever the paper size changes (`updatePrintPageSize()`), not just before printing, so the first printed page uses the correct size.

## Important Code Locations

- `js/app.js:9-26` — global state and conversion constants.
- `js/app.js:49-84` — localStorage snapshot save/restore.
- `js/app.js:159-275` — system font scanning and dropdown.
- `js/app.js:376-407` — zoom logic.
- `js/app.js:655-690` — paper size handling and `@page` rule maintenance.
- `js/app.js:884-902` — drop coordinate math; note the `rulerPadding = 24` offset.
- `js/app.js:927-956` / `974-1019` — field DOM rendering and update.
- `js/app.js:1717-1761` — `executePrint()` with image decode wait.
- `js/app.js:1763-1847` — `createPrintPage()` and alignment helpers.
- `js/app.js:1397-1437` — `loadTemplate()` with the `newProject(true)` reset.
- `js/app.js:1412-1491` — `newProject()` with `clearTimeout(saveTimer)` guard.
- `js/app.js:848-868` — `clearExcelData()` for the new clear-data button.

## Common Tasks

### Test a change in the browser

```bash
cd /Users/yanglijun/Desktop/game/BatchPrintPro
python3 -m http.server 8080
```

Then open `http://localhost:8080`, upload `测试数据.xlsx`, load `打印模板_210x297test.json`, preview, and print.

### Generate a larger test Excel

A helper script can create a multi-row file for batch-print stress testing:

```bash
python3 - <<'PY'
import openpyxl
wb = openpyxl.Workbook()
ws = wb.active
ws.append(['学生ID', '行政班', '学号', '姓名'])
for i in range(1, 121):
    ws.append([f'ID{i:04d}', f'班级{i%10+1}', f'2026{i:05d}', f'学生{i}'])
wb.save('/Users/yanglijun/Desktop/game/BatchPrintPro/测试数据_120行.xlsx')
PY
```

### Verify JS syntax

```bash
node -e "new Function(require('fs').readFileSync('/Users/yanglijun/Desktop/game/BatchPrintPro/js/app.js', 'utf-8'))"
```

## Conventions

- Keep all UI strings in Simplified Chinese to match the existing interface.
- Use `debouncedSave()` after any state mutation that should persist across reloads.
- When modifying print layout, test both the on-screen preview (`preview-page`) and the browser print preview (`print-page`), because they use different CSS units and containers.
- Avoid adding new runtime dependencies; the project is intentionally dependency-free except for the SheetJS CDN.

## Known Limitations

- Font fallback on the target printing computer can cause layout shifts.
- Sub-pixel differences exist between Chrome/Safari/Firefox print engines.
- Large base64 background images inflate project file size.
- Excel rows beyond ~5000 may cause visible delays in data preview and print generation.
