import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/products',    label: '📦 Products' },
  { to: '/categories',  label: '🗂  Categories' },
  { to: '/search',      label: '🔍 Search' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-full py-4 flex-shrink-0">
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-primary-50 text-primary-700'
                 : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
