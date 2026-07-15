const DEFAULT_MENUS = [
  // Thai - Adult
  { id: 'dm1', name: 'ผัดกะเพราหมูสับ', nationality: 'Thai', targetAudience: 'Adult', items: [ { ingredientId: 'P_001', gramsPerPerson: 150 }, { ingredientId: 'SH_001', gramsPerPerson: 30 } ] },
  { id: 'dm2', name: 'ต้มยำกุ้ง', nationality: 'Thai', targetAudience: 'Adult', items: [ { ingredientId: 'SH_001', gramsPerPerson: 120 }, { ingredientId: 'SQ_001', gramsPerPerson: 50 }, { ingredientId: 'P_001', gramsPerPerson: 30 } ] },
  { id: 'dm3', name: 'หมึกผัดพริกเกลือ', nationality: 'Thai', targetAudience: 'Adult', items: [ { ingredientId: 'SQ_001', gramsPerPerson: 180 }, { ingredientId: 'SH_001', gramsPerPerson: 40 } ] },
  // Thai - Child
  { id: 'dm4', name: 'หมูสับทอดกระเทียม', nationality: 'Thai', targetAudience: 'Child', items: [ { ingredientId: 'P_001', gramsPerPerson: 120 }, { ingredientId: 'C_001', gramsPerPerson: 30 } ] },
  { id: 'dm5', name: 'หมูสับปั้นก้อนทอด', nationality: 'Thai', targetAudience: 'Child', items: [ { ingredientId: 'P_001', gramsPerPerson: 140 }, { ingredientId: 'CR_001', gramsPerPerson: 20 } ] },
  
  // Chinese - Adult
  { id: 'dm6', name: 'เป็ดย่างฮ่องกง', nationality: 'Chinese', targetAudience: 'Adult', items: [ { ingredientId: 'D_001', gramsPerPerson: 200 } ] },
  { id: 'dm7', name: 'กระเพาะปลาเนื้อปู', nationality: 'Chinese', targetAudience: 'Adult', items: [ { ingredientId: 'CR_001', gramsPerPerson: 80 }, { ingredientId: 'C_001', gramsPerPerson: 50 } ] },
  { id: 'dm8', name: 'เนื้อผัดน้ำมันหอย', nationality: 'Chinese', targetAudience: 'Adult', items: [ { ingredientId: 'B_001', gramsPerPerson: 150 }, { ingredientId: 'P_001', gramsPerPerson: 20 } ] },
  // Chinese - Child
  { id: 'dm9', name: 'ข้าวต้มหมูเด้ง', nationality: 'Chinese', targetAudience: 'Child', items: [ { ingredientId: 'P_001', gramsPerPerson: 100 }, { ingredientId: 'SH_001', gramsPerPerson: 30 } ] },
  { id: 'dm10', name: 'ซาลาเปาหมูสับ', nationality: 'Chinese', targetAudience: 'Child', items: [ { ingredientId: 'P_001', gramsPerPerson: 80 } ] },

  // Indian - Adult
  { id: 'dm11', name: 'Chicken Tikka Masala', nationality: 'Indian', targetAudience: 'Adult', items: [ { ingredientId: 'C_001', gramsPerPerson: 180 } ] },
  { id: 'dm12', name: 'Beef Curry', nationality: 'Indian', targetAudience: 'Adult', items: [ { ingredientId: 'B_001', gramsPerPerson: 200 } ] },
  { id: 'dm13', name: 'Prawn Biryani', nationality: 'Indian', targetAudience: 'Adult', items: [ { ingredientId: 'SH_001', gramsPerPerson: 150 }, { ingredientId: 'C_001', gramsPerPerson: 50 } ] },
  // Indian - Child
  { id: 'dm14', name: 'Mild Chicken Curry', nationality: 'Indian', targetAudience: 'Child', items: [ { ingredientId: 'C_001', gramsPerPerson: 120 } ] },
  { id: 'dm15', name: 'Chicken Sausage Snack', nationality: 'Indian', targetAudience: 'Child', items: [ { ingredientId: 'CP_001', gramsPerPerson: 150 } ] },

  // American - Adult
  { id: 'dm16', name: 'Beef Burger', nationality: 'American', targetAudience: 'Adult', items: [ { ingredientId: 'B_001', gramsPerPerson: 180 }, { ingredientId: 'P_001', gramsPerPerson: 40 } ] },
  { id: 'dm17', name: 'Grilled Duck Breast', nationality: 'American', targetAudience: 'Adult', items: [ { ingredientId: 'D_001', gramsPerPerson: 220 } ] },
  { id: 'dm18', name: 'Roast Beef', nationality: 'American', targetAudience: 'Adult', items: [ { ingredientId: 'B_001', gramsPerPerson: 250 } ] },
  // American - Child
  { id: 'dm19', name: 'Chicken Nuggets', nationality: 'American', targetAudience: 'Child', items: [ { ingredientId: 'C_001', gramsPerPerson: 150 } ] },
  { id: 'dm20', name: 'Mini Pork Sausage', nationality: 'American', targetAudience: 'Child', items: [ { ingredientId: 'PP_001', gramsPerPerson: 100 } ] },
];
