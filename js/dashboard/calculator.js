/**
 * calculator.js — เครื่องยนต์คำนวณและประมวลผลตรรกะข้อมูล
 */

function calcTotalGuests(totalRooms, occupancyRate, guestsPerRoom) {
  return Math.round(totalRooms * (occupancyRate / 100) * guestsPerRoom);
}

function calcMealGuests(totalGuests, mealRate) {
  return Math.round(totalGuests * (mealRate / 100));
}

function calcRow(item, meal, mealGuests, bufferFactor, bufferRate) {
  const grams         = getGrams(item, meal);
  const baseKg        = (grams * mealGuests * bufferFactor) / 1000;
  const recommendedKg = baseKg * (1 + bufferRate / 100);
  const cost          = recommendedKg * item.pricePerKg;
  return { grams, baseKg, recommendedKg, cost };
}

function groupByCategory(items) {
  const order = [], map = {};
  items.forEach(item => {
    if (!map[item.category]) { map[item.category] = []; order.push(item.category); }
    map[item.category].push(item);
  });
  return { order, map };
}