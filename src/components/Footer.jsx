const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/le-van-tuy-88862a58" },
  { label: "X", href: "https://x.com/levantuy" },
  { label: "Facebook", href: "https://www.facebook.com/tuylv.vn" },
  { label: "Reddit", href: "https://www.reddit.com/user/tuylevan/" },
  { label: "GitHub", href: "https://github.com/levantuy" },
];

export default function Footer() {
  return (
    <footer className="app-footer z-30 text-sm text-center py-4 transition-colors duration-300 border-t border-gray-200 md:fixed md:bottom-0 md:inset-x-0">
      <div className="mx-auto flex w-full max-w-8xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>(c) 2026 Learn Journal. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <p className="text-gray-700 dark:text-gray-300">Developer: Learn Journal Team</p>
          {socialLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}