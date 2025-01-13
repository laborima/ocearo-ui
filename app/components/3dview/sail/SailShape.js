import { Vector2 } from 'three';

class SailShape {
  // Public properties
  draftDepth; // Camber/sail depth in [mm]
  draftDepthRatio; // Max draft as ratio vs. chord [1/1]
  draftPosition; // Numerically calculated position of max draft vs chord [mm]
  draftPositionRatio; // How forward the draft is positioned [1/1] - where 0.5 is middle, 0.0 beginning 1.0 end of shape
  forceAngleRad; // Forward inclination of sail lift force [rad]
  girth; // Length of sail following the parabolic shape [mm]
  mastAngleRad; // Mast angle as part of the sail-shape [rad]
  sag; // Sag (estimated outhaul movement) [mm]
  chordMastTop;
  chordTackLevel;
  mastWidth;

  // Private properties
  #shapeRotated = []; // Array of rotated sail shape points
  #shapeScaled = []; // Array of rotated and scaled sail shape points

  constructor(chordTackLevel, chordMastTop, mastWidth, cunningham = 1) {
    this.chordMastTop = chordMastTop;
    this.chordTackLevel = chordTackLevel;
    this.mastWidth = mastWidth;

    const parabola = (t, a = 1) => new Vector2(a * t ** 2, 2 * a * t);

    const tStart = 0.001;
    const tEndDefault = 1.001;
    const tEnd = tEndDefault + 0.95 * (cunningham - 1) / 10;
    const fullness = 1 - 0.25 * (cunningham - 1) / 10;
    const tInc = (tEnd - tStart) / 1000;

    let p1 = parabola(tStart);
    let p2 = parabola(tEnd);
    const phi = p2.clone().sub(p1).angle();

    let p0 = new Vector2(0, 0);
    for (let t = tStart; t <= tEnd; t += tInc) {
      let p = parabola(t);
      p.sub(p1);
      p.rotateAround(p0, -phi);
      this.#shapeRotated.push(p);
    }

    this.calcShape(fullness);
  }

  calcShape(fullness = 1) {
    this.#shapeScaled = [];
    let scale = this.chordTackLevel / (this.#shapeRotated[this.#shapeRotated.length - 1].x - this.#shapeRotated[0].x);

    for (let p of this.#shapeRotated) {
      let scaled = p.clone().multiplyScalar(scale);
      if (fullness !== 1) {
        scaled.y *= fullness;
      }
      this.#shapeScaled.push(scaled);
    }

    let pmax = new Vector2(0, 0);
    for (const p of this.#shapeScaled) {
      if (p.y > pmax.y) {
        pmax = p;
      }
    }

    this.draftDepth = pmax.y;
    this.draftPosition = pmax.x;

    this.girth = 0.0;
    let p1 = null;

    for (const p2 of this.#shapeScaled) {
      if (p1 !== null) {
        this.girth += p2.distanceTo(p1);
      }
      p1 = p2;
    }

    this.sag = this.chordTackLevel - this.girth;

    this.entryAngleRad = this.#shapeScaled[1].clone().sub(this.#shapeScaled[0]).angle();
    this.exitAngleRad = this.#shapeScaled[this.#shapeScaled.length - 1].clone().sub(this.#shapeScaled[this.#shapeScaled.length - 2]).angle() - Math.PI * 2;
    this.mastAngleRad = this.calcMastAngle();

    this.forceAngleRad = (this.entryAngleRad + this.exitAngleRad) / 2;

    this.draftDepthRatio = this.draftDepth / this.chordTackLevel;
    this.draftPositionRatio = this.draftPosition / this.chordTackLevel;
  }

  calcMastAngle() {
    let girth = 0;
    let p1 = null;
    let scaledMastWidth = (this.mastWidth * this.chordTackLevel) / this.chordMastTop;
    for (const p2 of this.#shapeScaled) {
      if (p1 !== null) {
        girth += p2.distanceTo(p1);
        if (girth >= scaledMastWidth) {
          return p2.angle();
        }
      }
      p1 = p2;
    }
    return NaN;
  }

  getVerticesAngles(numberOfPoints, mastWidth, clipOffWidth = null) {
    const segmentLength = (this.girth - mastWidth) / (numberOfPoints - 1);
    let point = 0;
    let girth = 0;
    let angles = [];
    let p1 = null;
    for (const p2 of this.#shapeScaled) {
      if (p1 !== null) {
        girth += p2.distanceTo(p1);
        if ((girth >= point * segmentLength + mastWidth) || (clipOffWidth && girth > clipOffWidth)) {
          point++;
          angles.push(p2.angle());
        }
        if (point >= numberOfPoints) {
          break;
        }
      }
      p1 = p2;
    }
    return angles;
  }

  pointAtGirthDistance(distance) {
    let girth = 0.0;
    let p1 = null;
    for (const p2 of this.#shapeScaled) {
      if (p1 !== null) {
        girth += p2.distanceTo(p1);
      }
      p1 = p2;
      if (girth >= distance) {
        return p1.clone();
      }
    }
  }
}

export default SailShape;
