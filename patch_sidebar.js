const fs = require('fs');

let content = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');

// Add imports
if (!content.includes("next/link")) {
  content = content.replace('import React from "react";', 'import React from "react";\nimport Link from "next/link";\nimport { usePathname } from "next/navigation";');
}

// Update Sidebar component to usePathname
content = content.replace('const { mode, toggleMode } = useTheme();', 'const { mode, toggleMode } = useTheme();\n  const pathname = usePathname();');

// Update NavItems
content = content.replace(
  '<NavItem icon="terminal" label="Foco Workspace" active={mode === "foco"} collapsed={isCollapsed} tag="RUNNING" />',
  '<NavItem href="/deep-work" icon="terminal" label="Deep Work" active={pathname === "/deep-work"} collapsed={isCollapsed} tag="RUNNING" />'
);

content = content.replace(
  '<NavItem icon="monitoring" label="Process Telemetry" collapsed={isCollapsed} tag="SYS" />',
  '<NavItem href="/" icon="monitoring" label="Dashboard" active={pathname === "/"} collapsed={isCollapsed} tag="SYS" />'
);

content = content.replace(/<NavItem icon=/g, '<NavItem href="#" icon=');

// Update NavItem props and component to use Link
content = content.replace(
  'const NavItem = ({ icon, label, active, collapsed, tag }: { icon: string, label: string, active?: boolean, collapsed: boolean, tag?: string }) => {',
  'const NavItem = ({ href = "#", icon, label, active, collapsed, tag }: { href?: string, icon: string, label: string, active?: boolean, collapsed: boolean, tag?: string }) => {'
);

content = content.replace(
  '<a\n      href="#"',
  '<Link\n      href={href}'
);

content = content.replace(
  '</a>\n  );',
  '</Link>\n  );'
);

fs.writeFileSync('src/components/shell/Sidebar.tsx', content);
