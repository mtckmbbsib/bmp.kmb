const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.jsx')) return;
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf-8');
  
  if (!content.includes('<select')) return;
  
  let newContent = content.replace(/<select(\s|>)/g, '<SearchableSelect$1');
  newContent = newContent.replace(/<\/select>/g, '</SearchableSelect>');
  
  if (newContent.includes('SearchableSelect') && !newContent.includes('import SearchableSelect')) {
    const globalRegex = /^import .*?;?$/gm;
    let match;
    let lastIndex = 0;
    while ((match = globalRegex.exec(newContent)) !== null) {
      lastIndex = globalRegex.lastIndex;
    }
    
    const importStmt = "import SearchableSelect from '../components/SearchableSelect';\n";
    if (lastIndex > 0) {
      newContent = newContent.slice(0, lastIndex) + '\n' + importStmt + newContent.slice(lastIndex);
    } else {
      newContent = importStmt + newContent;
    }
  }
  
  fs.writeFileSync(filepath, newContent, 'utf-8');
  console.log('Updated ' + file);
});
