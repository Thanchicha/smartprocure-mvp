(function initMockData() {
  if (!localStorage.getItem('sp_mock_initialized_v9')) {
    
    // Generate dates
    function generateTargetDates(start, end) {
      const daysCount = [1, 2, 3, 5, 7][Math.floor(Math.random() * 5)];
      
      let dates = [];
      let current = start + Math.floor(Math.random() * (end - start - daysCount + 2)); 
      if (current > end) current = end;
      
      for (let i = 0; i < daysCount; i++) {
        let d = current + i;
        if (d > 31) d = 31; 
        dates.push(`2026-07-${d.toString().padStart(2, '0')}`);
      }
      return [...new Set(dates)].sort(); // remove duplicates and sort
    }

    const itemsPool = [
      { code: 'P001', name: 'หมูสามชั้น', category: 'ชิ้นส่วนหมู', pricePerKg: 150 },
      { code: 'P002', name: 'หมูสันคอ', category: 'ชิ้นส่วนหมู', pricePerKg: 180 },
      { code: 'P005', name: 'ซี่โครงหมู', category: 'ชิ้นส่วนหมู', pricePerKg: 165 },
      { code: 'SH001', name: 'กุ้งขาว', category: 'กุ้ง', pricePerKg: 395 },
      { code: 'SH002', name: 'กุ้งแชบ๊วย', category: 'กุ้ง', pricePerKg: 420 },
      { code: 'CR001', name: 'ปูม้า', category: 'ปู', pricePerKg: 450 },
      { code: 'C001', name: 'อกไก่', category: 'ชิ้นส่วนไก่', pricePerKg: 70 },
      { code: 'C002', name: 'น่องไก่', category: 'ชิ้นส่วนไก่', pricePerKg: 65 },
      { code: 'SQ001', name: 'หมึกกล้วย', category: 'หมึก', pricePerKg: 220 },
      { code: 'SQ002', name: 'หมึกหอม', category: 'หมึก', pricePerKg: 240 },
      { code: 'B001', name: 'เนื้อสันใน', category: 'ชิ้นส่วนวัว', pricePerKg: 350 },
      { code: 'B003', name: 'เนื้อริบอาย', category: 'ชิ้นส่วนวัว', pricePerKg: 480 },
      { code: 'PS001', name: 'สามชั้นสไลด์', category: 'หมูกระทะ/ชาบู', pricePerKg: 180 },
      { code: 'PS002', name: 'สันคอสไลด์', category: 'หมูกระทะ/ชาบู', pricePerKg: 190 }
    ];

    const hotelNames = [
      'พาราไดซ์บีชรีสอร์ท', 'เดอะแกรนด์ วิว', 'โอเชียนบลู โฮเทล', 'สยามเฮอริเทจ', 'ภูผา คีรี รีสอร์ท', 'ริเวอร์ฟร้อนท์ สเตย์', 'ป่าตอง ซันเซ็ต', 'บางกอก บูทีค โฮสเทล', 'ล้านนา รีทรีท', 'หัวหิน ซีไซด์',
      'กะรน บีชรีสอร์ท', 'ไม้ขาว ดรีม', 'ราไวย์ แกรนด์', 'ในหาน เบย์', 'ฉลอง วิลล่า'
    ];
    const contactNames = [
      'สมชาย ใจดี', 'สมหญิง รักสงบ', 'วิชัย มานะ', 'กมลชนก สุขใจ', 'ธนาธร แซ่ลี้', 'นฤมล เจริญโชค', 'กฤษฎา พูนผล', 'สุดาวัลย์ นิลวงค์', 'ประเสริฐ แซ่ตั้ง', 'อนงค์ สุวรรณ',
      'สุรศักดิ์ ทวีลาภ', 'กัญญารัตน์ ศิริกุล', 'ชัยวัฒน์ ธรรมปัญญา', 'วิไลวรรณ สง่า', 'จิราพร บุญหนัก'
    ];
    const addresses = [
      '12/3 ถ.ทวีวงศ์ ต.ป่าตอง อ.กะทู้ จ.ภูเก็ต 83150', 
      '45/6 ต.กะรน อ.เมือง จ.ภูเก็ต 83100', 
      '789 ถ.วิเศษ ต.ราไวย์ อ.เมือง จ.ภูเก็ต 83130', 
      '12 ซ.บางลา ต.ป่าตอง อ.กะทู้ จ.ภูเก็ต 83150', 
      '55/5 หาดกะตะ ต.กะรน อ.เมือง จ.ภูเก็ต 83100', 
      '88 ถ.ศรีสุนทร ต.เชิงทะเล อ.ถลาง จ.ภูเก็ต 83110', 
      '99/1 ต.กมลา อ.กะทู้ จ.ภูเก็ต 83150', 
      '33 หาดสุรินทร์ ต.เชิงทะเล อ.ถลาง จ.ภูเก็ต 83110', 
      '77 ถ.เทพกระษัตรี ต.เกาะแก้ว อ.เมือง จ.ภูเก็ต 83000', 
      '101 แหลมพันวา ต.วิชิต อ.เมือง จ.ภูเก็ต 83000',
      '11/1 ต.กะรน อ.เมือง จ.ภูเก็ต 83100',
      '22/2 ต.ไม้ขาว อ.ถลาง จ.ภูเก็ต 83110',
      '33/3 ต.ราไวย์ อ.เมือง จ.ภูเก็ต 83130',
      '44/4 ต.ราไวย์ อ.เมือง จ.ภูเก็ต 83130',
      '55/5 ต.ฉลอง อ.เมือง จ.ภูเก็ต 83130'
    ];

    for (let i = 1; i <= 15; i++) {
      const username = `hotel${i}`;
      
      // Save Profile
      localStorage.setItem(`sp_profile_${username}`, JSON.stringify({
        businessName: hotelNames[i-1],
        customerType: 'โรงแรม',
        contactName: contactNames[i-1],
        contactPhone: `080-${Math.floor(100 + Math.random()*899)}-${Math.floor(1000 + Math.random()*8999)}`,
        shippingAddress: addresses[i-1]
      }));

      // Generate Random Order
      let targetDates = [];
      if (i <= 10) {
        targetDates = generateTargetDates(20, 27);
      } else {
        targetDates = generateTargetDates(25, 31);
      }
      
      // Random 4-8 items
      const itemCount = 4 + Math.floor(Math.random() * 5);
      const shuffled = [...itemsPool].sort(() => 0.5 - Math.random());
      const selectedItems = shuffled.slice(0, itemCount);
      
      let totalNetCost = 0;
      const net_order_items = selectedItems.map(item => {
        const netKg = (1 + Math.floor(Math.random() * 4)) * targetDates.length; // 1-4 kg per day per item
        const netCost = netKg * item.pricePerKg;
        totalNetCost += netCost;
        return {
          code: item.code,
          name: item.name,
          category: item.category,
          netKg: netKg,
          pricePerKg: item.pricePerKg,
          netCost: netCost,
          moqStatus: 'green'
        };
      });

      const order = {
        id: `mock_${username}_${Date.now()}`,
        created_date: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7), // 0-7 days ago
        updated_date: Date.now(),
        status: 'submitted',
        target_dates: targetDates,
        total_net_cost: totalNetCost,
        net_order_items: net_order_items
      };

      localStorage.setItem(`sp_batch_orders_${username}`, JSON.stringify([order]));
      
      // Add credentials for testing
      if (!window.MOCK_CREDENTIALS) window.MOCK_CREDENTIALS = [];
      window.MOCK_CREDENTIALS.push({username: username, password: 'password', name: `Hotel ${i}`, role: 'customer'});
    }

    localStorage.setItem('sp_mock_initialized_v9', 'true');
    console.log("Mock data for 15 hotels initialized.");
  }
  
})();
