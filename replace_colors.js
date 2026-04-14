const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'frontend/src'));
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/indigo/g, 'violet');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${file}`);
    changedCount++;
  }
});

console.log(`Replaced 'indigo' with 'violet' in ${changedCount} files.`);
