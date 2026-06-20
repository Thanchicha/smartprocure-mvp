/* eslint-disable */
// SmartProcure — Calculation Engine

const Calc = {
  totalGuests(totalRooms, occupancyRate, guestsPerRoom){
    return Math.round(totalRooms * (occupancyRate/100) * guestsPerRoom);
  },
  mealGuests(totalGuests, mealRate){
    return Math.round(totalGuests * (mealRate/100));
  },
  baseKg(gramsPerPerson, mealGuests, bufferFactor=1){
    return (gramsPerPerson * mealGuests * bufferFactor) / 1000;
  },
  recommendedKg(baseKg, bufferRate){
    return baseKg * (1 + bufferRate/100);
  },
  netOrder(recommendedKg, leftoverStock){
    return Math.max(0, recommendedKg - (leftoverStock||0));
  },
  orderQty(recommendedKg, unit='kg', unitSize=1){
    if(unit==='pack'){
      const packs = Math.ceil(recommendedKg/unitSize);
      return {qty:packs, kg:packs*unitSize, display:`${packs} แพ็ค = ${(packs*unitSize).toFixed(1)} กก.`};
    }
    const kg = Math.ceil(recommendedKg);
    return {qty:kg, kg, display:`${kg} กก.`};
  },
  cost(orderResult, pricePerKg, unit='kg', unitSize=1){
    if(unit==='pack') return orderResult.qty * (pricePerKg * unitSize);
    return orderResult.kg * pricePerKg;
  },
  itemRow({gramsPerPerson, mealGuests, bufferRate, pricePerKg, unit='kg', unitSize=1}, round=false){
    const base = this.baseKg(gramsPerPerson, mealGuests);
    const rec = this.recommendedKg(base, bufferRate);
    let ord;
    if(round) {
      ord = this.orderQty(rec, unit, unitSize);
    } else {
      ord = { qty: rec, kg: rec, display: `${rec.toFixed(2)} กก.` };
    }
    const cost = this.cost(ord, pricePerKg, unit, unitSize);
    return {
      baseKg: parseFloat(base.toFixed(3)),
      recommendedKg: parseFloat(rec.toFixed(3)),
      orderQty: ord.qty, orderKg: ord.kg,
      orderDisplay: ord.display, cost: Math.round(cost)
    };
  },
  moqStatus(orderKg, moq){
    if(orderKg<=0) return 'gray';
    if(orderKg>=moq) return 'green';
    if(orderKg>=moq*0.8) return 'yellow';
    return 'red';
  },
  MOQ_LABEL: {green:'ผ่าน MOQ', yellow:'ใกล้ขั้นต่ำ', red:'ต่ำกว่า MOQ', gray:'-'},
  MOQ_BADGE: {green:'badge-moq-green', yellow:'badge-moq-yellow', red:'badge-moq-red', gray:'badge-moq-gray'},
};