import { execSync } from "node:child_process";
import type { ToolPlugin } from "../manager";

const MAX_QUERY_LENGTH = 500;
const MAX_OUTPUT_RESULTS = 10;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function escapeShellArg(arg: string): string {
  // Escape single quotes by ending the string, adding an escaped quote, and restarting
  return arg.replace(/'/g, "'\"'\"'");
}

function parseDuckDuckGoResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // DuckDuckGo HTML structure uses div.result elements
  // Each result has: h2.result__title with an <a>, div.result__snippet, etc.
  const resultRegex = /<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
  const results_html = html.match(resultRegex) || [];
  
  for (const resultHtml of results_html.slice(0, MAX_OUTPUT_RESULTS)) {
    // Extract URL and title from h2.result__title > a
    const titleMatchResult = resultHtml.match(/<h2[^>]*class="[^"]*result__title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    // Extract snippet from div.result__snippet
    const snippetMatchResult = resultHtml.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    // Alternative: extract from .result__a for links
    const altLinkMatchResult = resultHtml.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    
    let url = "";
    let title = "";
    let snippet = "";
    
    if (titleMatchResult && titleMatchResult[1] && titleMatchResult[2]) {
      url = titleMatchResult[1];
      title = titleMatchResult[2].replace(/<[^>]+>/g, "").trim();
    } else if (altLinkMatchResult && altLinkMatchResult[1] && altLinkMatchResult[2]) {
      url = altLinkMatchResult[1];
      title = altLinkMatchResult[2].replace(/<[^>]+>/g, "").trim();
    }
    
    if (snippetMatchResult && snippetMatchResult[1]) {
      snippet = snippetMatchResult[1].replace(/<[^>]+>/g, "").trim();
    }
    
    // Only add if we have at least a title or URL
    if (title || url) {
      results.push({ title: title || "(no title)", url: url || "", snippet: snippet || "(no snippet)" });
    }
  }
  
  return results;
}

export const websearchPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web using DuckDuckGo. Returns up to 10 search results with titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query (max 500 characters).",
          },
        },
        required: ["query"],
      },
    },
  },
  execute: (args: { query: string }) => {
    try {
      // Validate query
      if (!args.query || args.query.trim().length === 0) {
        return "Error: Query cannot be empty.";
      }
      
      if (args.query.length > MAX_QUERY_LENGTH) {
        return `Error: Query too long (max ${MAX_QUERY_LENGTH} characters).`;
      }
      
      console.log(`> Web search: "${args.query}"`);
      
      // Build curl command to fetch DuckDuckGo HTML results
      const escapedQuery = escapeShellArg(args.query.trim());
      const curlCmd = `curl -s -L 'https://html.duckduckgo.com/html/?q=${escapedQuery}' -A 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' --max-time 30`;
      
      let html: string;
      try {
        html = execSync(curlCmd, { encoding: "utf-8", timeout: 35000 });
      } catch (e: any) {
        if (e.code === "ETIMEDOUT") {
          return "Error: Web search timed out after 30 seconds.";
        }
        return `Error: Failed to fetch search results: ${e.message}`;
      }
      
      // Check for "no results" indicators
      if (html.includes("No results") || html.includes("no_results") || html.length < 1000) {
        return "No results found for this query.";
      }
      
      // Parse results
      const results = parseDuckDuckGoResults(html);
      
      if (results.length === 0) {
        return "No parseable results found. The search page structure may have changed.";
      }
      
      // Format output
      let output = `Search Results for: "${args.query}"\n`;
      output += "=".repeat(60) + "\n\n";
      
      for (let i = 0; i < results.length; i++) {
        const r = results[i]!;  // Safe because we're iterating over results.length
        output += `[${i + 1}] ${r.title}\n`;
        output += `    URL: ${r.url}\n`;
        output += `    ${r.snippet}\n\n`;
      }
      
      output += `---\nFound ${results.length} results via DuckDuckGo`;
      
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};
