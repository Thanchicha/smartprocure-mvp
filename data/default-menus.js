const DEFAULT_MENUS = [
  // Thai - Adult
  { id: 'dm1', name: 'ผัดกะเพราหมูสับ', nationality: 'Thai', targetAudience: 'Adult', items: [ { ingredientId: 'p05', gramsPerPerson: 150 } ] },
  { id: 'dm2', name: 'ต้มยำกุ้ง', nationality: 'Thai', targetAudience: 'Adult', items: [ { ingredientId: 's01', gramsPerPerson: 120 } ] },
  { id: 'dm3', name: 'หมึกผัดพริกเกลือ', nationality: 'Thai', targetAudience: 'Adult', items: [ { ingredientId: 'sq01', gramsPerPerson: 180 } ] },
  // Thai - Child
  { id: 'dm4', name: 'หมูสับทอดกระเทียม', nationality: 'Thai', targetAudience: 'Child', items: [ { ingredientId: 'p05', gramsPerPerson: 100 } ] },
  { id: 'dm5', name: 'หมูสับปั้นก้อนทอด', nationality: 'Thai', targetAudience: 'Child', items: [ { ingredientId: 'p05', gramsPerPerson: 120 } ] },
  
  // Chinese - Adult
  { id: 'dm6', name: 'เป็ดย่างฮ่องกง', nationality: 'Chinese', targetAudience: 'Adult', items: [ { ingredientId: 'd01', gramsPerPerson: 150 } ] },
  { id: 'dm7', name: 'กระเพาะปลาเนื้อปู', nationality: 'Chinese', targetAudience: 'Adult', items: [ { ingredientId: 'cr02', gramsPerPerson: 80 } ] },
  { id: 'dm8', name: 'เนื้อผัดน้ำมันหอย', nationality: 'Chinese', targetAudience: 'Adult', items: [ { ingredientId: 'b01', gramsPerPerson: 150 } ] },
  // Chinese - Child
  { id: 'dm9', name: 'ข้าวต้มหมูเด้ง', nationality: 'Chinese', targetAudience: 'Child', items: [ { ingredientId: 'p05', gramsPerPerson: 80 } ] },
  { id: 'dm10', name: 'ซาลาเปาหมูสับ', nationality: 'Chinese', targetAudience: 'Child', items: [ { ingredientId: 'p05', gramsPerPerson: 50 } ] },

  // Indian - Adult
  { id: 'dm11', name: 'Chicken Tikka Masala', nationality: 'Indian', targetAudience: 'Adult', items: [ { ingredientId: 'c01', gramsPerPerson: 150 } ] },
  { id: 'dm12', name: 'Beef Curry', nationality: 'Indian', targetAudience: 'Adult', items: [ { ingredientId: 'b03', gramsPerPerson: 150 } ] },
  { id: 'dm13', name: 'Prawn Biryani', nationality: 'Indian', targetAudience: 'Adult', items: [ { ingredientId: 's01', gramsPerPerson: 120 } ] },
  // Indian - Child
  { id: 'dm14', name: 'Mild Chicken Curry', nationality: 'Indian', targetAudience: 'Child', items: [ { ingredientId: 'c01', gramsPerPerson: 100 } ] },
  { id: 'dm15', name: 'Chicken Sausage Snack', nationality: 'Indian', targetAudience: 'Child', items: [ { ingredientId: 'c07', gramsPerPerson: 150 } ] },

  // American - Adult
  { id: 'dm16', name: 'Beef Burger', nationality: 'American', targetAudience: 'Adult', items: [ { ingredientId: 'pb03', gramsPerPerson: 150 }, { ingredientId: 'pp01', gramsPerPerson: 30 } ] },
  { id: 'dm17', name: 'Grilled Duck Breast', nationality: 'American', targetAudience: 'Adult', items: [ { ingredientId: 'd01', gramsPerPerson: 180 } ] },
  { id: 'dm18', name: 'Roast Beef', nationality: 'American', targetAudience: 'Adult', items: [ { ingredientId: 'pb02', gramsPerPerson: 180 } ] },
  // American - Child
  { id: 'dm19', name: 'Chicken Nuggets', nationality: 'American', targetAudience: 'Child', items: [ { ingredientId: 'c04', gramsPerPerson: 100 } ] },
  { id: 'dm20', name: 'Mini Pork Sausage', nationality: 'American', targetAudience: 'Child', items: [ { ingredientId: 'pp04', gramsPerPerson: 80 } ] },
];
