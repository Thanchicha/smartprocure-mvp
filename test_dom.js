const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.addEventListener('error', event => {
  console.error("DOM ERROR:", event.error.message, event.error.stack);
});

setTimeout(() => {
  console.log("Check complete.");
}, 3000);
