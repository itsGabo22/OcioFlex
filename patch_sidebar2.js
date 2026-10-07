const fs = require('fs');
let content = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');

content = content.replace(
  '<NavItem href="#" icon="headphones" label="Ocio Lounge" active={mode === "ocio"} collapsed={isCollapsed} tag="MEDIA" />',
  '<NavItem href="/entertainment" icon="headphones" label="Entertainment" active={pathname === "/entertainment"} collapsed={isCollapsed} tag="MEDIA" />'
);

fs.writeFileSync('src/components/shell/Sidebar.tsx', content);
