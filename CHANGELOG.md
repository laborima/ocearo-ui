## [0.1.17] - 2026-02-12

### Fixed
- Fixed tank data mismatch between 3D view and dashboard widget by centralizing all tank sample data in SampleData.js and removing widget-level debug fallbacks.
- Fixed battery monitor displaying misleading default values (12V/18%/18H) when no real data is available; now shows 0V/0% and N/A for endurance.
- Fixed battery percentage text (100%) overlapping adjacent labels by reducing font size and clamping indicator position.
- Fixed logbook view showing fake sample entries when not in debug mode.
- Fixed corrupted Swedish and Finnish flag emojis in the language selector.
- Fixed OcearoCore API 404 errors flooding the console with full HTML pages; now handled silently as NetworkError.
- Fixed motor view not taking full available height in the right pane.

### Changed
- Redesigned AIS vessel info panel as a compact floating overlay with close button and horizontal label/value layout.
- Redesigned 3D view tank/battery indicators with Tesla-style mini gauge bars, transparent background, and proper sizing.
- Made 3D toolbar background fully transparent, removing opaque backdrop.
- Increased clock and tank/battery indicator sizes in 3D view to match toolbar proportions.
- Debug data injection in OcearoContext now only activates when debugMode is explicitly enabled, even on SignalK connection failure.

## [0.1.16] - 2026-01-07

### Added
- Introduced a dedicated Autopilot view with controller tooling and exposed it via the right pane menu for quick access.
- Delivered a Navigation context plus Course widget that surfaces SignalK routes, waypoints, and course calculations directly on the dashboard.
- Centralized weather handling with a Weather context, reusable fallback hooks, and an upgraded widget that can display forecast data when sensors are offline.
- Enhanced the 3D experience with toggleable laylines, improved toolbar state management, AIS client authentication, and a dynamic day/night ocean skybox.
- Added fuel log utilities, a refill modal, and richer motor/logbook presentations to capture consumption history and analytics.
- Checked in documentation specs, new 3D vessel models, and AIS test scaffolding to support future UX/content work.
- Integrated `recharts` for data visualization and `framer-motion` for enhanced UI animations.

### Changed
- Major infrastructure upgrade: Migrated to **Next.js 16**, **React 19**, and **Tailwind CSS v4**.
- Modernized CSS architecture by moving theme configurations to CSS variables in `globals.css` and adopting the new `@theme` block.
- Updated core dependencies: `three` (0.182.0), `@react-three/fiber` (9.4.2), and `@react-three/drei` (10.7.7).
- Refactored PostCSS configuration to use `@tailwindcss/postcss`.
- Bumped FontAwesome icons to version 7.1.0.
- Updated tide data year to 2026 for La Rochelle.
- Bumped the application version to 0.1.16 in both root and public manifests.

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
