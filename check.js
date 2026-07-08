const fs = require('fs');
['js/ai.js', 'pages/menu-select.js', 'pages/calculator.js', 'pages/profile.js', 'js/app.js'].forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    new Function(code);
    console.log(file, 'syntax OK');
  } catch(e) {
    console.error(file, 'SYNTAX ERROR:', e.message);
  }
});
