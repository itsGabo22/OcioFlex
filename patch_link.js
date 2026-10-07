const fs = require('fs');
let content = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');

content = content.replace(/<a\s+href="#"/g, '<Link href={href}');
content = content.replace(/<\/a>/g, '</Link>');

fs.writeFileSync('src/components/shell/Sidebar.tsx', content);
