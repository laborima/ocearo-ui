
"Please design a new 'Motor View' for the ocearo UI. This view should display comprehensive engine and related system information. The data will be sourced from the following Signal K paths. Ensure the UI clearly distinguishes between multiple engines/tanks/batteries if present, using the instance number from the Signal K path.
Respect the style and color scheme of the battery view.

Primary Engine Data (per engine instance):

    RPM (Revolutions Per Minute):

        vessels.self.propulsion.<instance>.revolutions (value in Hz, multiply by 60 for RPM)

        Alternatively, some gateways might provide: vessels.self.propulsion.<instance>.revolutions.value (directly in RPM)

    Total Engine Hours:

        vessels.self.propulsion.<instance>.runTime (value in seconds)

    Coolant Temperature:

        vessels.self.propulsion.<instance>.coolantTemperature (value in Kelvin)

    Coolant Pressure:

        vessels.self.propulsion.<instance>.coolantPressure (value in Pascals)

    Boost Pressure (Turbo):

        vessels.self.propulsion.<instance>.boostPressure (value in Pascals)

    Engine Oil Pressure:

        vessels.self.propulsion.<instance>.oilPressure (value in Pascals)

    Engine Oil Temperature:

        vessels.self.propulsion.<instance>.oilTemperature (value in Kelvin)

    Fuel Rate (Consumption):

        vessels.self.propulsion.<instance>.fuel.rate (value in m^3/s)

    Fuel Delivery Pressure:

        vessels.self.propulsion.<instance>.fuel.pressure (value in Pascals)

    Percent Engine Load:

        vessels.self.propulsion.<instance>.load (value as a ratio, 0.0 to 1.0)

    Percent Engine Torque:

        vessels.self.propulsion.<instance>.torque (value as a ratio, 0.0 to 1.0 for actual, can be higher for requested)

    Exhaust Gas Temperature:

        vessels.self.propulsion.<instance>.exhaustTemperature (value in Kelvin)

    Engine Tilt/Trim:

        vessels.self.propulsion.<instance>.tilt (value in radians or degrees, check source) or

        vessels.self.propulsion.<instance>.trimPosition (often a percentage 0-100, or raw value from sensor)

    Intake Manifold Temperature:

        vessels.self.propulsion.<instance>.intakeManifoldTemperature (value in Kelvin)

        (Note: YDEG-04 can map this to a generic NMEA 2000 temperature PGN 130316, your N2K->SK gateway needs to interpret the instance/source type correctly)

Transmission Data (per engine/transmission instance):

    Transmission Current Gear:

        vessels.self.propulsion.<instance>.transmission.gear (value: -1 for reverse, 0 for neutral, 1+ for forward gears)

    Transmission Oil Pressure:

        vessels.self.propulsion.<instance>.transmission.oilPressure (value in Pascals)

    Transmission Oil Temperature:

        vessels.self.propulsion.<instance>.transmission.oilTemperature (value in Kelvin)

Electrical Data:

    Battery Voltage (per battery instance, as configured in YDEG.TXT):

        vessels.self.electrical.batteries.<instance>.voltage (value in Volts)

    Battery Current (per battery instance, if available and configured):

        vessels.self.electrical.batteries.<instance>.current (value in Amperes, negative for discharge)

    Alternator Potential (Voltage, per engine/alternator instance):

        vessels.self.electrical.alternators.<instance>.voltage (value in Volts)

    Alternator Current (per engine/alternator instance, if available):

        vessels.self.electrical.alternators.<instance>.current (value in Amperes)

Fuel System Data (per tank instance, as configured in YDEG.TXT):

    Fuel Tank Level:

        vessels.self.tanks.fuel.<instance>.currentLevel (value as a ratio, 0.0 to 1.0)

    Fuel Tank Capacity (if configured in YDEG.TXT or reported by sensor):

        vessels.self.tanks.fuel.<instance>.capacity (value in m^3)

Warnings and Alarms (Notifications):
The YDEG-04 outputs engine/transmission status via NMEA 2000 PGN 127489 (Engine Dynamic Parameters) and 127493 (Transmission Dynamic Parameters), which contain status bitfields. A good NMEA 2000 to Signal K gateway will translate these bits into individual notification paths. The UI should monitor the notifications tree for relevant engine/transmission alarms.
Examples (refer to YDEG-04 manual Appendix B for NMEA 2000 bits and your N2K->SK gateway for exact paths):

    notifications.propulsion.<instance>.checkEngine

    notifications.propulsion.<instance>.overTemperature

    notifications.propulsion.<instance>.lowOilPressure

    notifications.propulsion.<instance>.lowOilLevel

    notifications.propulsion.<instance>.lowFuelPressure

    notifications.propulsion.<instance>.lowSystemVoltage (could also be notifications.electrical.batteries.<instance>.lowVoltage)

    notifications.propulsion.<instance>.lowCoolantLevel

    notifications.propulsion.<instance>.waterInFuel

    notifications.propulsion.<instance>.transmission.overTemperature

    notifications.propulsion.<instance>.transmission.lowOilPressure

    (The specific path under notifications.* will depend on the gateway. Each notification should have state ('alarm', 'warning') and message fields.)

    Also consider displaying raw status bitfields if available:

        vessels.self.propulsion.<instance>.status1 (for engine status bits from PGN 127489)

        vessels.self.propulsion.<instance>.status2 (for other engine status bits from PGN 127489)

        vessels.self.propulsion.<instance>.transmission.status1 (for transmission status bits from PGN 127493)

Multisensor Data (typically environment, from EVC-A C4:MULTISENSOR port via YDEG-04):

    Water Temperature (Sea Temperature):

        vessels.self.environment.water.temperature (value in Kelvin)

    Depth Below Transducer:

        vessels.self.environment.depth.belowTransducer (value in meters)

    Speed Through Water:

        vessels.self.navigation.speedThroughWater (value in m/s)

UI Considerations:

    Use clear visual indicators for warnings (yellow) and alarms (red).

    If multiple engines, provide a summary view and individual detailed views.

    Handle missing data gracefully (e.g., display 'N/A' or hide the field).

    Ensure data updates dynamically as new Signal K messages arrive.

This list provides a comprehensive set of Signal K paths to build a rich engine monitoring view. "

Key Points from the YDEG-04 Manual influencing this:

    Engine Instances (V.1): ENGINE_0=0, ENGINE_1=1 etc., map J1939 addresses to NMEA 2000 instances, which will become Signal K instances (usually 0 for port/single, 1 for starboard).

    Battery Mapping (V.2, V.3): NMEA_BATTERY=KEYSWITCH and BATTERY_0=0 etc., define which J1939 source provides battery data and to which NMEA 2000 battery instance it maps.

    Fuel Tank Mapping (V.5, V.6): FUEL=DIESEL, FUEL_0=0,PORT etc., map J1939 fuel tank data.

    Warnings (VI, Appendix B): Details how specific engine conditions (J1939 SPN/FMI or proprietary) are mapped to NMEA 2000 status bits within PGNs 127489 and 127493. Your NMEA 2000 to Signal K gateway should parse these.

    NMEA 2000 PGNs (Appendix C): Lists PGNs like 127488 (Rapid Update), 127489 (Dynamic), 127493 (Transmission), 127505 (Fluid Level), 127508 (Battery). These are the direct NMEA 2000 sources for most data.

    SmartCraft Mapping (Appendix H): If you have SmartCraft engines, this shows how their data maps to the NMEA 2000 PGNs.

    EVC-A MC Multisensor (IV.1.4, V.21-V.24): Data like depth, sea temp, SOW come from here and are standard NMEA 2000 PGNs.

    Intake Manifold / Exhaust Temp (V.25, V.18): These can be outputted via PGN 130316 or other specific PGNs if available.

