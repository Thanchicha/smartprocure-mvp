// SmartProcure — AI Module (Gemini API Integration)

const AI = (() => {
  async function recommendMenus(plan, targetMeal, availableMenus, onComplete) {
    const profile = DB.getProfile();
    const apiKey = (profile.geminiApiKey || '').trim();
    if (!apiKey) {
      UI.toast('กรุณาบันทึก Gemini API Key ในหน้าโปรไฟล์ก่อนนะครับ', 'error');
      onComplete(null);
      return;
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const guestConfig = plan.guestConfig || p;
    let totalGuests = 0;
    if (guestConfig.useManualGuests) {
      totalGuests = guestConfig.manualGuests || 0;
    } else {
      totalGuests = Calc.totalGuests(guestConfig.totalRooms||0, guestConfig.occupancyRate||0, guestConfig.guestsPerRoom||1);
    }

    const extData = plan.ext || {};
    const extSummary = [];
    if (extData.nat_europe) extSummary.push(`Europe/Western: ${extData.nat_europe}`);
    if (extData.nat_china) extSummary.push(`China: ${extData.nat_china}`);
    if (extData.nat_india) extSummary.push(`India: ${extData.nat_india}`);
    if (extData.nat_domestic) extSummary.push(`Domestic/Thai: ${extData.nat_domestic}`);
    if (extData.adults) extSummary.push(`Adults: ${extData.adults}`);
    if (extData.children) extSummary.push(`Children: ${extData.children}`);

    const mealName = targetMeal === 'breakfast' ? 'มื้อเช้า' : (targetMeal === 'lunch' ? 'มื้อกลางวัน' : 'มื้อเย็น');

    const promptText = `
    You are an expert menu planner for a hotel/restaurant.
    Given the following demographic data for a specific day, recommend 3 to 6 suitable menus for ${mealName} from the provided list of available menus.
    
    Demographic Data:
    - Total Guests: ${totalGuests}
    - Extracted Data (from PMS): ${extSummary.length > 0 ? extSummary.join(', ') : 'None'}

    Available Menus (JSON format):
    ${JSON.stringify(availableMenus.map(m => ({ id: m.id, name: m.name, nationality: m.nationality, targetAudience: m.targetAudience })))}

    Please respond with ONLY a valid JSON object matching this schema:
    {
      "reasoning": "A brief explanation (in Thai) of why you chose these menus based on the demographics. Use newlines (\\n) and bullet points (*) to make it easy to read.",
      "recommendedMenuIds": ["id1", "id2", "id3"]
    }
    Make sure the reasoning is clear, uses polite Thai language, highlights the demographic connections, and is formatted as a bulleted list with newlines.
    `;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!response.ok) {
        throw new Error('API Request Failed');
      }

      const data = await response.json();
      let textResponse = data.candidates[0].content.parts[0].text;
      
      // Clean up markdown formatting if Gemini returns ```json ... ```
      textResponse = textResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      
      const result = JSON.parse(textResponse);
      onComplete(result);
    } catch (err) {
      console.error(err);
      UI.toast('การเชื่อมต่อกับ AI ขัดข้อง หรือ API Key ไม่ถูกต้อง', 'error');
      onComplete(null);
    }
  }

  async function recommendAllPlans(plans, availableMenus, onComplete) {
    const profile = DB.getProfile();
    const apiKey = (profile.geminiApiKey || '').trim();
    if (!apiKey) {
      UI.toast('กรุณาบันทึก Gemini API Key ในหน้าโปรไฟล์ก่อนนะครับ', 'error');
      onComplete(null);
      return;
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const daysData = plans.map(p => {
      const guestConfig = p.guestConfig || DB.getProfile();
      let totalGuests = guestConfig.useManualGuests ? (guestConfig.manualGuests || 0) : Calc.totalGuests(guestConfig.totalRooms||0, guestConfig.occupancyRate||0, guestConfig.guestsPerRoom||1);
      
      const extData = p.ext || {};
      let demographics = 'None';
      
      if (extData.mealCounts) {
        demographics = {
          breakfast_guests: extData.mealCounts.breakfast.total,
          breakfast_adults: extData.mealCounts.breakfast.adults,
          breakfast_children: extData.mealCounts.breakfast.children,
          breakfast_nationalities: extData.mealCounts.breakfast.nat,
          lunch_guests: extData.mealCounts.lunch.total,
          lunch_adults: extData.mealCounts.lunch.adults,
          lunch_children: extData.mealCounts.lunch.children,
          lunch_nationalities: extData.mealCounts.lunch.nat,
          dinner_guests: extData.mealCounts.dinner.total,
          dinner_adults: extData.mealCounts.dinner.adults,
          dinner_children: extData.mealCounts.dinner.children,
          dinner_nationalities: extData.mealCounts.dinner.nat
        };
      } else {
        const extSummary = [];
        if (extData.nat_europe) extSummary.push(`Europe/Western: ${extData.nat_europe}`);
        if (extData.nat_china) extSummary.push(`China: ${extData.nat_china}`);
        if (extData.nat_india) extSummary.push(`India: ${extData.nat_india}`);
        if (extData.nat_domestic) extSummary.push(`Domestic/Thai: ${extData.nat_domestic}`);
        if (extData.adults) extSummary.push(`Adults: ${extData.adults}`);
        if (extData.children) extSummary.push(`Children: ${extData.children}`);
        if (extSummary.length > 0) demographics = extSummary.join(', ');
      }

      return {
        plan_date: p.plan_date,
        totalGuests,
        demographics
      };
    });

    const promptText = `
    You are an expert menu planner for a hotel/restaurant.
    Given the following demographic data for a multi-day plan, recommend suitable menus for breakfast, lunch, and dinner for EACH day from the provided list of available menus.
    Note: The demographic data may contain exact guest counts and nationalities for EACH meal (breakfast, lunch, dinner). Please pay close attention to this when selecting menus (e.g., if lunch has mostly Chinese guests, but dinner has Indian guests).
    
    Days Data:
    ${JSON.stringify(daysData, null, 2)}

    Available Menus (JSON format):
    ${JSON.stringify(availableMenus.map(m => ({ id: m.id, name: m.name, nationality: m.nationality, targetAudience: m.targetAudience })))}

    Please respond with ONLY a valid JSON object matching this schema:
    {
      "reasoning": "A brief explanation (in Thai) of the overall meal plan strategy based on the demographics. Use newlines (\\n) and bullet points (*) to make it easy to read.",
      "recommendations": [
        {
          "plan_date": "YYYY-MM-DD",
          "breakfast": ["menu_id1", "menu_id2"],
          "lunch": ["menu_id3", "menu_id4"],
          "dinner": ["menu_id5", "menu_id6"]
        }
      ]
    }
    Ensure the reasoning is in polite Thai language. Each recommendation should contain 2-4 menu IDs per meal. Make sure the plan_date matches exactly.
    `;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!response.ok) throw new Error('API Request Failed');

      const data = await response.json();
      let textResponse = data.candidates[0].content.parts[0].text;
      textResponse = textResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      
      const result = JSON.parse(textResponse);
      onComplete(result);
    } catch (err) {
      console.error(err);
      UI.toast('การเชื่อมต่อกับ AI ขัดข้อง หรือ API Key ไม่ถูกต้อง', 'error');
      onComplete(null);
    }
  }

  return { recommendMenus, recommendAllPlans };
})();
