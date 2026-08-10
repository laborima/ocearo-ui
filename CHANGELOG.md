## [0.1.22] - 2026-08-10

### Added

- **Swing track at anchor.** The anchored 3D view now draws the path the boat has actually described around the anchor, not just a circle. A veering shift, a boat sailing at anchor or an anchor starting to drag are all read at a glance from the shape of the track, where a bare circle showed nothing until the alarm fired. The track is recorded server-side by ocearo-core (`GET /navigation/anchor/track`), so it survives a UI reload and is cleared when the anchor is dropped or raised.
- **KIP-style card compass** replacing the 3D boat widget on the dashboard's navigation tab: rotating rose with a fixed lubber line, large heading readout, COG and apparent-wind index markers on the rim, and COG/SOG/AWA/AWS in the info bar. Drawn in SVG rather than WebGL — the widget it replaces ran a full renderer, HDR environment and orbit controls permanently to display a heading number, on a Pi already short of CPU. Falls back to magnetic heading, labelled `MAG`, when true heading is unavailable.

### Fixed

- **The anchor circle was drawn wrong in three ways.** Its radius was hard-coded to 50 m and ignored the configured alarm radius; it was centred on the first position seen after mount rather than the recorded drop point; and its north/south sign was inverted relative to the convention the AIS view uses, so the boat appeared to move the wrong way across the circle. It now reads `navigation.anchor.position` and `navigation.anchor.maxRadius`, shares the AIS projection convention, and adds the 80 % watch ring and the rode line.
- **The anchorage overlay was drawn north-up in a boat-up scene.** `SailBoat3D` pins its yaw to zero, so the hull is always drawn bow-up and the world has to be counter-rotated by the heading — which the AIS view already does and the new anchor overlay did not. An anchor 30 m due north was drawn straight ahead of the bow whatever way the boat was lying, taking the rode line and the swing track with it.
- **Tides silently returned nothing after a power cut without internet.** The Pi has no RTC battery: it boots at 1970 and `fake-hwclock` restores a possibly days-old date. The tide file is chosen by `MM_YYYY` and then indexed by today's date, so a wrong clock found no entry at all and the widget just looked empty. The UI now derives its wall clock from the GPS `navigation.datetime` published on the NMEA2000 bus whenever the system clock is more than a minute off, and the time widget flags when it is doing so.

## [0.1.21] - 2026-08-10

### Added

- **Raspberry Pi tab** in the battery/system view: temperature, CPU, memory and disk meters, firmware throttling flags and the heaviest processes, polled from the new ocearo-core `/system/metrics` endpoint. Translated in all 12 locales.

### Fixed

- **A missing autopilot provider looked like a working but idle autopilot.** A pilot on the NMEA2000 bus publishes `steering.autopilot.state` even with no v2 provider registered, so the view rendered a plausible panel in which nothing was controllable — precisely the "it doesn't work" case. The view now says so explicitly, distinguishing a pilot detected on the bus without a provider, no provider at all, and a provider that registered no device.
- The default autopilot device id was `default`; the Signal K v2 autopilot API reserves `_default` for the primary pilot, so every call addressed a device that does not exist.

## [0.1.20] - 2026-08-08

### Added

- **Depth column in the logbook** (table, timeline chips and manual-entry capture), translated in all 12 locales. The value was already being collected and stored on every entry — it simply had nowhere to appear.

### Fixed

- **`NaN` on the wind readouts.** Every guard in the conversion pipeline tested for `null`/`undefined` only, and `NaN !== null`, so a single non-numeric value propagated all the way to the DOM as the string "NaN". All converters in `UnitConversions.js` now reject non-finite input, and the weather, speed and wind widgets guard on finiteness instead of nullity. Symmetrically, the `|| 0` sites that silently swallowed `NaN` into a zeroed wind arrow are gone.
- **Manual logbook entries stored raw SI values under display-unit labels**: the log read 1852x too far (metres shown as NM), SOG and wind speed were m/s shown as knots, and wind direction was radians shown as degrees. Manual entries now use the same conversions as the server-generated ones, so both are comparable.
- **Logbook cells rendered the literal text `nullNM` / `nullkt`** — `Number(null)` is `0`, so the old `!Number.isNaN(Number(x))` guards let `null` through.
- **AIS radar flagged moored boats as collision risks.** The "CPA" ignored the target's course and speed entirely and subtracted a heading in radians from a bearing in degrees. Replaced with a real closest-point-of-approach computed from both vessels' COG/SOG, which returns no value at all rather than a fabricated one when a target's motion is unknown.
- **Autopilot control never reached the server**: calls targeted `/signalk/v2/api/vessels/self/steering/autopilot/{id}`, which is the v1 *data* path and not a REST endpoint, so every request 404'd and the view silently showed "off-line". Now uses the v2 `/autopilots/{id}` API with the `_default` device, and sends `target/adjust` as `{value, units:'deg'}` instead of bare radians.
- Sail geometry received `NaN` because `windSheer()` raised a negative height (below the waterline) to a fractional power.

### Notes

- True wind (`environment.wind.speedTrue`, `angleTrueWater`, `directionTrue`) and `navigation.headingTrue` are not published by the NMEA2000 bus on Cirrus; they require the **`signalk-derived-data`** plugin, enabled with the `heading`, `angleTrueWater` and `directionTrue` calculations. Without it the true-wind paths are simply absent.
- The autopilot view additionally requires an autopilot **provider** plugin server-side (e.g. `@signalk/signalk-autopilot`); the v2 API does not exist without one.

## [0.1.19] - 2026-07-22

### Added

- **Maintenance tab** replacing the transmission tab: manufacturer service schedules (Volvo Penta D1-20 default, D1/D2 series, Yanmar YM, generic diesel), per-item intervals in engine hours and months, last-done tracking with overdue/due-soon statuses, engine model selector (state persisted in localStorage; transmission fields moved into the engine tab).
- **Engine alarms finally visible**: subscription to the 24 NMEA2000 discrete engine notifications (PGN 127489 via engine gateways such as YDEG-04) plus zone notifications; warnings tab now actually receives them, with a persistent clickable alarm banner across all tabs and a red/yellow badge on the tab header.
- **Engine room temperature gauge** (1-Wire bilge probe on `environment.inside.engineRoom.temperature`) with early-warning thresholds — best early signal of raw-water/cooling failure.
- **Adaptive 3D chart plane**: map zoom follows camera distance (OSM z19 harbor detail with pontoons up close, wide area zoomed out), true-to-scale with the AIS layer, parent-tile fallback for missing tiles, OpenSeaMap seamark overlay (buoys, lights, marks), darkened palette to match the dark HUD.
- **Real weather map in meteo mode**: fixed wide coverage (~40 km) where the Windy wind overlay (contrast-boosted) and the live RainViewer precipitation radar are actually readable.
- **Wind-driven swell** on the 3D ocean: GPU vertex displacement with amplitude derived from estimated significant wave height (Hs ≈ 0.21·U²/g, capped at 6 m), three superimposed wave trains.
- **Weather sky**: procedural cloud sprites (offline-generated texture) and rain particles driven by forecast cloud cover and precipitation; sky haze follows overcast; ocean sky now also rendered in chart and meteo modes.
- **VOC-based air quality tile**: BME680 gas resistance displayed in kΩ with a qualitative scale (higher = cleaner) and humidity as secondary metric when no CO₂/PM2.5 sensors exist; falls back to CO₂ automatically when such a sensor is present.
- **Fuel analytics**: estimation shown as a range between worst and average consumption, full-tank assumption after a refill, engine hours persisted across reboots (estimation works with engine off), current engine hours field, hours-between-refills column and full refill history.
- **DND toggle** in the bottom bar cycling voice/safety-only/muted via the ocearo-core `/dnd` API.
- **Dashboard button** in the bottom navigation (replaces the embedded KIP gauges shortcut).
- White low-poly AIS fleet with size/orientation normalization, model preview page and 30 fps render cap for RPi5.

### Fixed

- Chart/meteo modes were unusably blurry: the map texture covered a fixed 10 km for a camera that only sees ~700 m.
- Engine warnings tab always showed "all systems nominal" because notification paths were never subscribed.
- Gauge ranges now match a Volvo D1-20: max 3600 rpm, coolant warn 95 °C / alarm 100 °C, engine room 55/70 °C, realistic oil pressure thresholds.
- Bilge and aft-locker 1-Wire probes remapped to their true SignalK paths (`engineRoom`, `lazarette`); air temperature widgets fall back to the sheltered aft-locker probe; weather card falls back to forecast.
- VOC showed raw ohms with a wrong "ppm" unit in the bottom widget.
- Black gap between the chart plane and the sky horizon (camera far plane raised to 2500, lite water tone matched to the reflective ocean).
- Tide heights, coefficient and chart ticks rounded to sensible decimals.
- Fuel tab: estimation key mismatch, N/A on range values, truncated history.
- AIS: sailboats floating above the waterline (per-type visual draft), boats lying on their side (glTF Y-up), static data (name/type/dimensions) not updating after initial load.
- Stray service worker unregistered in dev to prevent HMR reload loops.

### Changed

- RPi5 performance: chart and meteo modes use a lite ocean (sky, clouds and rain kept, no mirror-reflection pass — the scene is no longer rendered twice); swell mesh resolution tuned; library updates and removal of 93 MB of unused source models.

## [0.1.18] - 2026-02-25

### Fixed

- Fixed dashboard dashlets on mobile to show 3 visible with vertical scroll while preserving original height (200px) to prevent truncation.
- Fixed Next.js development error overlay appearing when OcearoCore server is unreachable by replacing console.error with console.warn.
- Fixed settings page save indicator causing layout shift and scroll jumps on small screens by using absolute positioning.

## [0.1.17] - 2026-02-23

### Added

- Anchor watch plugin with anchor state management and alarm functionality.
- AIS analysis feature in OcearoCore.
- Local logbook store fallback for when signalk-logbook is unavailable.
- Voice/TTS improvements including Piper fallback mechanisms.

### Fixed

- Fixed error handling and fallback behavior in LogbookManager when connecting to signalk-logbook.

### Changed

- Updated various translations and component layouts (motor view, logbook view, 3D compass, fuel log modal).
- Package dependencies minor version bumps and cleanups.

## [0.1.16] - 2026-02-18

### Added
- Full 3D jib/genoa sail with dynamic camber, twist, and forestay visualization (`Jib3D.js`).
- Mainsail reef management with dynamic geometry updates based on true wind speed (`Sail3D.js`).
- Rigging lines (backstay, boom vang, cunningham, outhaul) with tension-based color gradient: green → yellow → orange → red → violet (`Rigging3D.js`).
- Tension lines visualization for mainsheet, jib sheet, vang, and cunningham (`TensionLines3D.js`).
- Compass-style sail trim sliders at compass level:
  - GV (Grand-Voile): position-mode indicator showing traveller port/centre/starboard.
  - FP/FS (Foc Port/Starboard): fill-mode indicators showing jib car forward/aft position.
  - Inactive (leeward) jib car is fully greyed out; active (windward) side shows colored fill.
  - All sliders react dynamically to apparent wind angle and speed.
- Sail trim computation engine (`SailTrimUtils.js`, `useSailTrim.js`) deriving reef level, camber, twist, and tension from SignalK wind data.
- Settings toggles to show/hide sail trim sliders and rigging lines (Navigation & HUD section).
- Translations for new settings in all 12 supported languages.
- Debug wind override panel with speed and direction sliders for testing sail behavior.
- Debug 3D axes toggle in debug panel.
- Configurable units for speed (kn, km/h, mph, m/s), depth (m, ft, fa), temperature (°C, °F), and distance (nm, km, mi) in settings.
- Preferred paths settings for wind speed, wind direction, and heading/COG with French/English labels.
- Debug panel as a dedicated right-pane view accessible from the Apps menu when debug mode is active.
- Introduced a dedicated Autopilot view with controller tooling and exposed it via the right pane menu for quick access.
- Delivered a Navigation context plus Course widget that surfaces SignalK routes, waypoints, and course calculations directly on the dashboard.
- Centralized weather handling with a Weather context, reusable fallback hooks, and an upgraded widget that can display forecast data when sensors are offline.
- Enhanced the 3D experience with toggleable laylines, improved toolbar state management, AIS client authentication, and a dynamic day/night ocean skybox.
- Added fuel log utilities, a refill modal, and richer motor/logbook presentations to capture consumption history and analytics.
- Integrated `recharts` for data visualization and `framer-motion` for enhanced UI animations.

### Fixed
- Fixed jib top (HEAD) attachment point alignment with masthead at y=10.0.
- Fixed settings toggle using stale `isSettingsView` state instead of `rightView`.
- Fixed wind override flickering caused by SignalK delta updates overwriting override values.
- Fixed POL speed indicator showing speed unit instead of `%`.
- Fixed tank data mismatch between 3D view and dashboard widget by centralizing all tank sample data in SampleData.js.
- Fixed battery monitor displaying misleading default values (12V/18%/18H) when no real data is available; now shows 0V/0% and N/A for endurance.
- Fixed battery percentage text (100%) overlapping adjacent labels by reducing font size and clamping indicator position.
- Fixed logbook view showing fake sample entries when not in debug mode.
- Fixed corrupted Swedish and Finnish flag emojis in the language selector.
- Fixed OcearoCore API 404 errors flooding the console with full HTML pages; now handled silently as NetworkError.
- Fixed motor view not taking full available height in the right pane.

### Changed
- Major infrastructure upgrade: Migrated to **Next.js 16**, **React 19**, and **Tailwind CSS v4**.
- Modernized CSS architecture by moving theme configurations to CSS variables in `globals.css` and adopting the new `@theme` block.
- Updated core dependencies: `three` (0.182.0), `@react-three/fiber` (9.4.2), and `@react-three/drei` (10.7.7).
- Refactored PostCSS configuration to use `@tailwindcss/postcss`.
- Bumped FontAwesome icons to version 7.1.0.
- Updated tide data year to 2026 for La Rochelle.
- Redesigned 3D sail visualization with physically-based camber and twist calculations.
- Rigging reduced to essential control lines only (backstay, boom vang, cunningham, outhaul).
- Sail trim sliders moved from inside boat model to compass level for better visibility.
- All speed, depth, temperature, and distance displays now respect user-configured units across 3D view, dashboard widgets, and bottom bar.
- Compass dial and boat rotation now use the preferred heading path from settings.
- Moved debug info from a 3D popup overlay to a proper right-pane view with scrollable sections.
- Redesigned AIS vessel info panel as a compact floating overlay with close button and horizontal label/value layout.
- Redesigned 3D view tank/battery indicators with Tesla-style mini gauge bars, transparent background, and proper sizing.
- Made 3D toolbar background fully transparent, removing opaque backdrop.
- Unified top toolbar row alignment: toolbar, clock, and indicators now share a single flex container for consistent vertical alignment.
- Debug data injection in OcearoContext now only activates when debugMode is explicitly enabled, even on SignalK connection failure.

## [0.1.15] - 2025-10-27

### Added
- Introduced a right-pane dashboard with environment, navigation, and system tabs featuring widgets such as AIS radar, tide, weather, tank levels, and 3D boat status for consolidated situational awareness.
- Delivered a comprehensive engine monitoring experience with new gauge components and motor utilities covering temperatures, pressures, fuel data, and dual-engine selection.
- Added a logbook view and supporting context helpers to visualize vessel events alongside existing documentation assets. (Work in progress [Ocearo core needed])

### Changed
- Refined Ocearo context data access with reusable depth/tank helpers and broader SignalK fallbacks, improving widget data quality.
- Updated the app menu and right pane routing to expose dashboard, logbook, and engine monitoring while enhancing external URL handling.
- Improved configuration flows by resetting credentials when authentication is disabled and streamlining debug mode defaults.

### Other
- Refreshed documentation with new dashboard imagery.
- Bumped dependencies including `@signalk/client@^2.4.0` and patched transitive packages for compatibility and fixes.
