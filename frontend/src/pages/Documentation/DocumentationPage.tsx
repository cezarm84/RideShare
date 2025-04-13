import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import DocsNavigator from "../../components/DocsNavigator";
import TableOfContents, { TOCHeading } from "../../components/TableOfContents";
import { fetchDocumentationWithHeadings } from "../../services/documentationService";

// Register languages for syntax highlighting
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('sql', sql);

// This component will display the documentation content
const DocumentationPage: React.FC = () => {
  // State to track dark mode
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // Update isDarkMode when theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);
  console.log("DocumentationPage component rendered");
  const { docId = "index" } = useParams<{ docId: string }>();
  const [content, setContent] = useState<string>("");
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("DocumentationPage: Loading documentation for docId:", docId);
    const loadDocumentation = async () => {
      setLoading(true);
      try {
        const { content, headings } = await fetchDocumentationWithHeadings(docId);
        console.log("DocumentationPage: Content loaded, headings:", headings.length);
        setContent(content);
        setHeadings(headings);
        setError(null);
      } catch (err) {
        console.error("Error fetching documentation:", err);
        setError("Failed to load documentation. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadDocumentation();
  }, [docId]);

  // Custom components for ReactMarkdown
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      // Use different styles for light and dark mode
      const syntaxStyle = isDarkMode ? oneDark : oneLight;

      return !inline && match ? (
        <SyntaxHighlighter
          style={syntaxStyle}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '0.375rem',
            padding: '1rem',
            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm" {...props}>
          {children}
        </code>
      );
    },
    a({ node, href, children, ...props }: any) {
      // Handle internal documentation links
      if (href && href.endsWith('.md')) {
        const docPath = href.replace('.md', '');
        return (
          <a
            href={`/docs/${docPath}`}
            className="text-brand-500 hover:underline"
            {...props}
          >
            {children}
          </a>
        );
      }

      // External links
      return (
        <a
          href={href}
          className="text-brand-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    table({ node, children, ...props }: any) {
      return (
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border-collapse" {...props}>
            {children}
          </table>
        </div>
      );
    },
    th({ node, children, ...props }: any) {
      return (
        <th className="border px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold" {...props}>
          {children}
        </th>
      );
    },
    td({ node, children, ...props }: any) {
      return (
        <td className="border px-4 py-2" {...props}>
          {children}
        </td>
      );
    },
    h1({ node, children, ...props }: any) {
      return (
        <h1 className="text-3xl font-bold mb-4 mt-6" {...props}>
          {children}
        </h1>
      );
    },
    h2({ node, children, ...props }: any) {
      return (
        <h2 className="text-2xl font-bold mt-6 mb-3" {...props}>
          {children}
        </h2>
      );
    },
    h3({ node, children, ...props }: any) {
      return (
        <h3 className="text-xl font-bold mt-5 mb-2" {...props}>
          {children}
        </h3>
      );
    },
    h4({ node, children, ...props }: any) {
      return (
        <h4 className="text-lg font-bold mt-4 mb-2" {...props}>
          {children}
        </h4>
      );
    },
    p({ node, children, ...props }: any) {
      return (
        <p className="my-4" {...props}>
          {children}
        </p>
      );
    },
    ul({ node, children, ...props }: any) {
      return (
        <ul className="my-4 ml-6 list-disc" {...props}>
          {children}
        </ul>
      );
    },
    ol({ node, children, ...props }: any) {
      return (
        <ol className="my-4 ml-6 list-decimal" {...props}>
          {children}
        </ol>
      );
    },
    li({ node, children, ...props }: any) {
      return (
        <li className="ml-2" {...props}>
          {children}
        </li>
      );
    },
    hr({ ...props }: any) {
      return (
        <hr className="my-6 border-t border-gray-300 dark:border-gray-700" {...props} />
      );
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with documentation navigation */}
        <div className="lg:w-1/5">
          <DocsNavigator activeDocId={docId} />
        </div>

        {/* Main content area */}
        <div className="lg:w-3/5">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2.5"></div>
              </div>
            ) : error ? (
              <div className="p-4 border rounded-md bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <h2 className="text-xl font-bold mb-2">Error Loading Documentation</h2>
                <p>{error}</p>
                <p className="mt-4">Please try again later or check another documentation section.</p>
              </div>
            ) : (
              <div className="prose prose-blue max-w-none dark:prose-invert">
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                  remarkPlugins={[remarkGfm]}
                  components={components}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Table of contents */}
        <div className="lg:w-1/5">
          {!loading && !error && headings.length > 0 && <TableOfContents headings={headings} />}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
