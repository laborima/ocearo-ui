
/**
 * Shared drawing logic for Attitude and Heading indicators
 */

export const drawAttitudeInstrument = (ctx, options) => {
    const {
        w,
        h,
        roll,
        pitch,
        yaw,
        nightMode = false,
        showHeading = true,
        showPitchScale = true,
        showRollScale = true,
        showBezel = true,
        compact = false,
        colors = {}
    } = options;

    const cx = w / 2;
    const cy = h / 2;
    
    // Scaling factor based on size
    const REF_SIZE = compact ? 80 : 200;
    const s = Math.min(w, h) / REF_SIZE;
    const sw = (v) => v * s;
    const slw = (v) => Math.max(0.5, v * s);

    // Color theme
    const theme = {
        sky: nightMode ? '#1a0000' : (colors.sky || '#87CEEB'),
        sea: nightMode ? '#000000' : (colors.sea || colors.oGray2 || '#424242'),
        horizon: nightMode ? (colors.oNight || '#ef4444') : (colors.oYellow || '#ffbe00'),
        bezel: nightMode ? '#330000' : (colors.bezel || colors.oGray2 || '#424242'),
        text: nightMode ? (colors.oNight || '#ef4444') : (colors.text || 'var(--hud-text-main)'),
        boat: nightMode ? (colors.oNight || '#ef4444') : (colors.boat || colors.oYellow || '#ffbe00'),
        rollScale: nightMode ? (colors.oNight || '#ef4444') : (colors.rollScale || colors.oRed || '#cc000c'),
        headingMarks: nightMode ? (colors.oNight || '#ef4444') : (colors.headingMarks || 'var(--hud-text-main)'),
        pitchMarks: nightMode ? 'rgba(239, 68, 68, 0.6)' : (colors.pitchMarks || 'var(--hud-text-secondary)'),
        ...colors
    };

    ctx.clearRect(0, 0, w, h);

    const radius = Math.min(cx, cy) - sw(compact ? 5 : 20);

    // 1. Mobile part (Sky/Sea and Pitch Scale)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.translate(cx, cy);
    ctx.rotate(roll * Math.PI / 180);
    
    const pitchOffset = (pitch / 90) * radius * (compact ? 1 : 1.5);
    ctx.translate(0, pitchOffset);

    // Sky
    ctx.fillStyle = theme.sky;
    ctx.fillRect(-w, -h * 2, w * 2, h * 2);

    // Sea
    ctx.fillStyle = theme.sea;
    ctx.fillRect(-w, 0, w * 2, h * 2);

    // Horizon Line
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(w, 0);
    ctx.strokeStyle = theme.horizon;
    ctx.lineWidth = slw(compact ? 1.5 : 3);
    ctx.stroke();

    // Pitch Scale
    if (showPitchScale) {
        ctx.strokeStyle = theme.pitchMarks;
        ctx.fillStyle = theme.pitchMarks;
        ctx.font = `${Math.round(sw(compact ? 8 : 12))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const pitchRange = compact ? 60 : 30;
        const pitchStep = compact ? 20 : 10;

        for (let p = -pitchRange; p <= pitchRange; p += pitchStep) {
            if (p === 0) continue;
            const y = - (p / 90) * radius * (compact ? 1 : 1.5);
            const lineLength = (Math.abs(p) % 20 === 0 && !compact) ? sw(50) : sw(compact ? 15 : 30);
            
            ctx.beginPath();
            ctx.moveTo(-lineLength / 2, y);
            ctx.lineTo(lineLength / 2, y);
            ctx.lineWidth = slw(Math.abs(p) % 20 === 0 ? 2 : 1);
            ctx.stroke();

            if (!compact || Math.abs(p) % 40 === 0) {
                ctx.fillText(Math.abs(p) + '°', lineLength / 2 + sw(10), y);
                ctx.fillText(Math.abs(p) + '°', -lineLength / 2 - sw(10), y);
            }
        }
    }
    ctx.restore();

    // 2. Bezel / Rings
    if (showBezel) {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(cx, cy) - sw(compact ? 2 : 8), 0, Math.PI * 2);
        ctx.strokeStyle = theme.bezel;
        ctx.lineWidth = slw(compact ? 2 : 12);
        ctx.stroke();

        if (!compact) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = theme.bezel;
            ctx.lineWidth = slw(2);
            ctx.stroke();
        }
    }

    // 3. Heading Graduations
    if (showHeading) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.font = `bold ${Math.round(sw(compact ? 7 : 10))}px sans-serif`;
        ctx.textAlign = 'center';
        
        const step = compact ? 15 : 10;
        for (let deg = 0; deg < 360; deg += step) {
            const ang = (deg - yaw - 90) * Math.PI / 180;
            const rOut = radius + sw(compact ? 2 : 0);
            const isMajor = deg % (compact ? 90 : 30) === 0;
            const len = isMajor ? sw(compact ? 5 : 20) : sw(compact ? 2 : 10);
            
            const x1 = rOut * Math.cos(ang);
            const y1 = rOut * Math.sin(ang);
            const x2 = (rOut - len) * Math.cos(ang);
            const y2 = (rOut - len) * Math.sin(ang);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isMajor ? theme.headingMarks : (nightMode ? 'rgba(239, 68, 68, 0.4)' : theme.pitchMarks);
            ctx.lineWidth = isMajor ? slw(1.5) : slw(compact ? 0.5 : 2);
            ctx.stroke();
            
            if (isMajor && !compact) {
                const labels = ['N', 'E', 'S', 'W'];
                if (deg % 90 === 0) {
                    const labelX = (rOut - sw(35)) * Math.cos(ang);
                    const labelY = (rOut - sw(35)) * Math.sin(ang) + sw(4);
                    ctx.fillStyle = theme.text;
                    ctx.fillText(labels[deg / 90], labelX, labelY);
                }
            }
        }
        ctx.restore();
    }

    // 4. Boat Indicator
    ctx.save();
    ctx.translate(cx, cy);
    if (compact) {
        // Simple triangle for compact view
        ctx.rotate(yaw * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, -sw(10));
        ctx.lineTo(sw(5), sw(5));
        ctx.lineTo(-sw(5), sw(5));
        ctx.closePath();
        ctx.fillStyle = theme.boat;
        ctx.fill();
        ctx.strokeStyle = nightMode ? theme.boat : (colors.oGray || '#989898');
        ctx.lineWidth = slw(1);
        ctx.stroke();
    } else {
        // Full boat shape for widget
        ctx.beginPath();
        ctx.moveTo(0, -sw(25));
        ctx.lineTo(sw(12), sw(12));
        ctx.lineTo(0, sw(8));
        ctx.lineTo(-sw(12), sw(12));
        ctx.closePath();
        ctx.fillStyle = theme.horizon;
        ctx.fill();
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = slw(2);
        ctx.stroke();
        
        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, sw(3), 0, Math.PI * 2);
        ctx.fillStyle = theme.text;
        ctx.fill();
    }
    ctx.restore();

    // 5. Roll Indicator
    if (showRollScale && !compact) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(roll * Math.PI / 180);
        
        for (let r = -60; r <= 60; r += 30) {
            if (r === 0) continue;
            const ang = r * Math.PI / 180;
            const rOut = Math.min(cx, cy) - sw(30);
            const x1 = rOut * Math.sin(ang);
            const y1 = -rOut * Math.cos(ang);
            const x2 = (rOut - sw(15)) * Math.sin(ang);
            const y2 = -(rOut - sw(15)) * Math.cos(ang);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = theme.rollScale;
            ctx.lineWidth = slw(3);
            ctx.stroke();
        }
        ctx.restore();
    }
};
