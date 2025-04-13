import React, { useEffect, useState } from "react";

export interface TOCHeading {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TOCHeading[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  // Set up intersection observer to track which heading is in view
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" } // Start highlighting heading slightly before it reaches the top
    );

    // Observe all headings
    const headingElements = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
    headingElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      headingElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [headings]);

  // Only render if there are headings to show
  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block sticky top-4 w-64 pr-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-medium mb-3 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">On This Page</h3>
        <ul className="space-y-1 border-l border-gray-200 dark:border-gray-700">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={`pl-3 border-l-2 ${activeHeading === heading.id
                ? "border-brand-500 dark:border-brand-400"
                : "border-transparent"}`}
              style={{ marginLeft: `-1px`, paddingLeft: `calc(${(heading.level - 1) * 0.5}rem + 0.75rem)` }}
            >
              <a
                href={`#${heading.id}`}
                className={`block py-1 text-sm hover:text-brand-500 dark:hover:text-brand-400 transition-colors ${
                  activeHeading === heading.id
                    ? "text-brand-600 dark:text-brand-400 font-medium"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TableOfContents;
