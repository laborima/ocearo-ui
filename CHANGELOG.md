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
