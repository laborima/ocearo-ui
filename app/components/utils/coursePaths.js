/**
 * Values of the course to the next point, whichever way the server publishes
 * them: `navigation.course.calcValues.*` (Signal K course API, course-provider
 * 1.5 and later) or the older `navigation.courseGreatCircle.*` /
 * `navigation.courseRhumbline.*` paths, which course-provider 1.5 no longer
 * fills — the laylines and the route ribbon went blank after that update.
 */
const SOURCES = {
    bearingTrue: ['navigation.course.calcValues.bearingTrue', 'navigation.courseGreatCircle.nextPoint.bearingTrue', 'navigation.courseRhumbline.nextPoint.bearingTrue'],
    distance: ['navigation.course.calcValues.distance', 'navigation.courseGreatCircle.nextPoint.distance', 'navigation.courseRhumbline.nextPoint.distance'],
    timeToGo: ['navigation.course.calcValues.timeToGo', 'navigation.courseGreatCircle.nextPoint.timeToGo', 'navigation.courseRhumbline.nextPoint.timeToGo'],
    crossTrackError: ['navigation.course.calcValues.crossTrackError', 'navigation.courseGreatCircle.crossTrackError', 'navigation.courseRhumbline.crossTrackError'],
    velocityMadeGood: ['navigation.course.calcValues.velocityMadeGood', 'navigation.courseGreatCircle.velocityMadeGood', 'navigation.courseRhumbline.velocityMadeGood'],
};

/** Every Signal K path to subscribe to for the given course values */
export const coursePaths = (...keys) => keys.flatMap((k) => SOURCES[k]);

/** First finite value of a course quantity in a useSignalKPaths() result */
export const courseValue = (values, key) => {
    for (const path of SOURCES[key]) {
        const v = values?.[path];
        if (Number.isFinite(v)) return v;
    }
    return undefined;
};
