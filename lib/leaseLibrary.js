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
 * @param {{startDate: Date, endDate: Date}} dateRange1 - first date range
 * @param {{startDate: Date, endDate: Date}}  dateRange2 - second date range
 * @returns {Boolean}
 */

const dateRangeOverlaps = (dateRange1, dateRange2) => {
  if (
    dateRange1.startDate <= dateRange2.startDate &&
    dateRange2.startDate <= dateRange1.endDate
  )
    return true; // dateRange2 starts in dateRange1
  if (
    dateRange1.startDate <= dateRange2.endDate &&
    dateRange2.endDate <= dateRange1.endDate
  )
    return true; // dateRange2 ends in dateRange1
  if (
    dateRange2.startDate < dateRange1.startDate &&
    dateRange1.endDate < dateRange2.endDate
  )
    return true; // dateRange2 includes dateRange1
  return false;
};

module.exports = { haversineDistance, dateRangeOverlaps };
