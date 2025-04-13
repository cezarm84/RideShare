import { TOCHeading } from "../components/TableOfContents";

/**
 * Service for fetching documentation content and extracting headings
 */

// Extract headings from markdown content
export const extractHeadings = (markdown: string): TOCHeading[] => {
  const headings: TOCHeading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    // Remove any markdown formatting from the title (like backticks, asterisks, etc.)
    const cleanTitle = title
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*([^*]+)\*/g, '$1'); // Remove italic formatting

    const id = cleanTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    headings.push({
      id,
      title: cleanTitle,
      level,
    });
  }

  return headings;
};

// This implementation fetches markdown files from the docs directory
export const fetchDocumentation = async (docId: string): Promise<string> => {
  try {
    // Normalize the docId to handle potential issues
    const normalizedDocId = docId.replace(/:/g, '_').trim();

    console.log(`Fetching documentation for: ${normalizedDocId}`);

    // In a real implementation, this would be an API call to fetch the markdown file
    // For now, we'll use a static mapping to the markdown files
    const response = await fetch(`/docs/${normalizedDocId}.md`);

    if (!response.ok) {
      console.warn(`Documentation file not found: ${normalizedDocId}.md`);
      // Return a fallback message
      return `# ${normalizedDocId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

This documentation page is currently unavailable. Please check other documentation sections.

## Possible Reasons

- The documentation file may not exist yet
- The file might be in a different location
- There might be a typo in the URL

## Available Documentation

Please check the sidebar for available documentation topics.

[Return to Documentation Home](/docs/index)`;
    }

    const content = await response.text();
    console.log(`Successfully loaded documentation for: ${normalizedDocId}`);
    return content;
  } catch (error) {
    console.error('Error fetching documentation:', error);

    // If we can't fetch the file, return a fallback message
    return `# Documentation Error

We encountered an error while trying to load the requested documentation.

## Possible Reasons

- The documentation file may not exist
- There might be a network issue
- The server might be experiencing problems

## What to Do

- Try refreshing the page
- Check if the URL is correct
- Try accessing a different documentation page

[Return to Documentation Home](/docs/index)

If you need immediate assistance, please contact our support team at support@rideshare.example.com.`;
  }
};

// Interface for documentation content with headings
export interface DocumentationContent {
  content: string;
  headings: TOCHeading[];
}

// Fetch documentation content and extract headings
export const fetchDocumentationWithHeadings = async (docId: string): Promise<DocumentationContent> => {
  const content = await fetchDocumentation(docId);
  const headings = extractHeadings(content);

  return {
    content,
    headings,
  };
};
