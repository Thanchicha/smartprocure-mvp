const fs = require('fs');
let code = fs.readFileSync('pages/calculator.js', 'utf8');

code = code.replace(/const days = state\.days \|\| 1;/g, "const days = getCurrentPlan().days || 1;");
code = code.replace(/\$\{state\.plan_date\}/g, "${getCurrentPlan().plan_date}");
code = code.replace(/state\.days = Math\.max/g, "getCurrentPlan().days = Math.max");
code = code.replace(/state\.plan_date = /g, "getCurrentPlan().plan_date = ");
code = code.replace(/if \(!state\.ext\)/g, "if (!getCurrentPlan().ext)");
code = code.replace(/const ext = state\.ext;/g, "const ext = getCurrentPlan().ext;");
code = code.replace(/state\.fileName/g, "getCurrentPlan().fileName");
code = code.replace(/state\.ext/g, "getCurrentPlan().ext");

// Remove the old loadPlan function which was left behind
code = code.replace(/function loadPlan\(plan\) \{\s*state\.id = plan\.id;[\s\S]*?isDirty = false;\s*\}/, "");

fs.writeFileSync('pages/calculator.js', code);
console.log('Fixed lingering state variables.');
