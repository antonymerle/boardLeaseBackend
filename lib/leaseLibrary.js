/**
 * @name haversineDistance
 * @function
 * @memberof module:lib/leaseLibrary
 * @desc Calculate distance between two geographic coordinates in km or miles
 * @param {Array<Number>} coordinatesSet1
 * @param {Array<Number>} coordinatesSet2
 * @returns {Boolean}
 */

const haversineDistance = ([lat1, lon1], [lat2, lon2], isMiles = false) => {
  const toRadian = (angle) => (Math.PI / 180) * angle;
  const distance = (a, b) => (Math.PI / 180) * (a - b);
  const RADIUS_OF_EARTH_IN_KM = 6371;

  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);

  lat1 = toRadian(lat1);
  lat2 = toRadian(lat2);

  // Haversine Formula
  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  let finalDistance = RADIUS_OF_EARTH_IN_KM * c;

  if (isMiles) {
    finalDistance /= 1.60934;
  }

  return Math.floor(finalDistance * 100) / 100;
};

/**
 * @name dateRangeOverlaps
 * @function
 * @memberof module:lib/leaseLibrary
 * @desc Checks if two date ranges objects overlaps: {startDate1, endDate1} vs {startDate2, endDate2}
 * @param {Object} dateRange1 - first date range
 * @param {Object} dateRange2 - second date range
 * @param {Date} dateRange1.startDate - start date of date range, inclusive
 * @param {Date} dateRange1.endDate - end date of date range, inclusive
 * @param {Date} dateRange2.startDate - start date of date range, inclusive
 * @param {Date} dateRange2.endDate - end date of date range, inclusive
 * @returns {Boolean}
 */

const dateRangeOverlaps = (dateRange1, dateRange2) => {
  if (
    dateRange1.startDate <= dateRange2.startDate &&
    dateRange2.startDate <= dateRange1.endDate
  )
    return true; // b starts in a
  if (
    dateRange1.startDate <= dateRange2.endDate &&
    dateRange2.endDate <= dateRange1.endDate
  )
    return true; // b ends in a
  if (
    dateRange2.startDate < dateRange1.startDate &&
    dateRange1.endDate < dateRange2.endDate
  )
    return true; // a in b
  return false;
};

module.exports = { haversineDistance, dateRangeOverlaps };
