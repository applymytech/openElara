#!/usr/bin/env python3
# backend/scrapy_worker.py

import sys
import json
import os
from pathlib import Path
import scrapy
from scrapy.crawler import CrawlerProcess
import tempfile
import shutil
from datetime import datetime
import re
from typing import Any, List, Optional, Dict, Union, Tuple, cast

class AIScraperSpider(scrapy.Spider):
    name = 'ai_scraper'
    
    def __init__(self, start_urls: Optional[List[str]] = None, scrape_type: str = 'basic', max_pages: Union[str, int] = 1, output_dir: Optional[str] = None, *args: Any, **kwargs: Any) -> None:
        super(AIScraperSpider, self).__init__(*args, **kwargs)
        self.start_urls = start_urls or []
        self.scrape_type = scrape_type
        self.max_pages = int(max_pages)
        self.scraped_count = 0
        self.output_dir = output_dir

    async def start(self):
        if self.start_urls:
            for url in self.start_urls:
                yield scrapy.Request(url=url, callback=self.parse)
    
    def parse(self, response: Any) -> Any:
        self.scraped_count += 1
        print(f"DEBUG: Scraping page {self.scraped_count}: {response.url}", flush=True)
        
        internal_links: List[str] = []
        for link in response.css('a::attr(href)').getall():
            absolute_url = response.urljoin(link)
            if absolute_url.startswith(response.url.split('//')[0] + '//' + response.url.split('//')[1].split('/')[0]):
                internal_links.append(absolute_url)
        
        if self.scrape_type == 'links':
            yield {
                'url': response.url,
                'internal_links': internal_links,
                'timestamp': datetime.now().isoformat(),
                'scrape_type': self.scrape_type
            }
        else:
            main_content = self.extract_main_content(response)

            yield {
                'url': response.url,
                'title': response.css('title::text').get(default='').strip(),
                'description': response.css('meta[name="description"]::attr(content)').get(default=''),
                'h1': response.css('h1::text').get(default=''),
                'main_content': main_content,
                'timestamp': datetime.now().isoformat(),
                'scrape_type': self.scrape_type
            }
        
        if self.scraped_count >= self.max_pages:
            raise cast(Any, scrapy.exceptions).CloseSpider(f"Reached max_pages limit: {self.max_pages}")
    
    def extract_main_content(self, response: Any) -> str:
        try:
            from markdownify import markdownify as md
            
            main_selectors = [
                'main',
                'article',
                '[role="main"]',
                '#main-content',
                '#content',
                '.main-content',
                '.content',
                'body'
            ]
            
            main_element = None
            for selector in main_selectors:
                main_element = response.css(selector).get()
                if main_element:
                    break
            
            if not main_element:
                main_element = response.css('body').get()
            
            markdown_content = md(
                main_element,
                heading_style="ATX",
                bullets="-",
                strong_em_symbol="**",
                strip=['script', 'style', 'nav', 'footer', 'header', 'aside'],
            )
            
            lines = [line.rstrip() for line in markdown_content.split('\n')]
            cleaned_lines: List[str] = []
            blank_count = 0
            for line in lines:
                if line.strip():
                    cleaned_lines.append(line)
                    blank_count = 0
                else:
                    blank_count += 1
                    if blank_count <= 2:
                        cleaned_lines.append(line)
            
            return '\n'.join(cleaned_lines).strip()
            
        except ImportError:
            return self._manual_html_to_markdown(response)
    
    def _manual_html_to_markdown(self, response: Any) -> str:
        """
        Fallback manual conversion of HTML to Markdown.
        Preserves basic structure: headings, paragraphs, lists, bold, italic.
        """
        markdown_parts: List[str] = []
        
        for i in range(1, 7):
            headings = response.css(f'h{i}::text').getall()
            for heading in headings:
                heading_text = heading.strip()
                if heading_text:
                    markdown_parts.append(f"{'#' * i} {heading_text}\n")
        
        paragraphs = response.css('p').getall()
        for p in paragraphs:
            text = re.sub(r'<[^>]+>', '', p).strip()
            text = re.sub(r'<strong>(.*?)</strong>', r'**\1**', text)
            text = re.sub(r'<b>(.*?)</b>', r'**\1**', text)
            text = re.sub(r'<em>(.*?)</em>', r'*\1*', text)
            text = re.sub(r'<i>(.*?)</i>', r'*\1*', text)
            
            if text:
                markdown_parts.append(f"{text}\n")
        
        ul_lists = response.css('ul')
        for ul in ul_lists:
            items = ul.css('li::text').getall()
            for item in items:
                item_text = item.strip()
                if item_text:
                    markdown_parts.append(f"- {item_text}")
            markdown_parts.append("")
        
        ol_lists = response.css('ol')
        for ol in ol_lists:
            items = ol.css('li::text').getall()
            for idx, item in enumerate(items, 1):
                item_text = item.strip()
                if item_text:
                    markdown_parts.append(f"{idx}. {item_text}")
            markdown_parts.append("")
        
        content = '\n'.join(markdown_parts)
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        return content.strip()

def run_scrapy_task(command: str, urls: List[str], scrape_type: str = 'basic', max_pages: Union[str, int] = 1, output_dir: Optional[str] = None) -> Tuple[bool, str]:
    print(f"--- Starting Scrapy Task: {command} ---", flush=True)

    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix='scrapy_output_')
        print(f"Using temp output directory: {output_dir}", flush=True)
    else:
        os.makedirs(output_dir, exist_ok=True)
        print(f"Using output directory: {output_dir}", flush=True)

    settings_dict: Dict[str, Any] = {
        'BOT_NAME': 'AI Assistant Scraper',
        'SPIDER_MODULES': ['scrapy_worker'],
        'NEWSPIDER_MODULE': 'scrapy_worker',
        'ROBOTSTXT_OBEY': True,
        'USER_AGENT': 'AI-Assistant-Scraper/1.0 (+https://applymytech.ai)',
        'LOG_LEVEL': 'INFO',
        'DOWNLOAD_DELAY': 1,
        'CONCURRENT_REQUESTS': 1,
        'RANDOMIZE_DOWNLOAD_DELAY': 0.5,
        'AUTOTHROTTLE_ENABLED': True,
        'FEEDS': { str(Path(output_dir) / 'scraped_data.json'): {'format': 'json', 'overwrite': True} }
    }
    
    original_cwd = os.getcwd()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    print(f"DEBUG: Changed directory to: {os.getcwd()}", flush=True)

    try:
        process = CrawlerProcess(settings_dict)

        process.crawl(
            AIScraperSpider,
            start_urls=urls,
            scrape_type=scrape_type,
            max_pages=max_pages,
            output_dir=output_dir
        )

        process.start()

        results_file_path = Path(output_dir) / 'scraped_data.json'
        all_results: List[Any] = []
        if results_file_path.exists():
            with open(results_file_path, 'r', encoding='utf-8') as f:
                all_results = cast(List[Any], json.load(f))
            os.remove(results_file_path)

        for result in all_results:
            result = cast(Dict[str, Any], result)

            if scrape_type == 'links':
                from urllib.parse import urlparse
                parsed_url = cast(Any, urlparse(result.get('url')))
                base_filename = cast(str, parsed_url.hostname).replace('.', '_') or 'untitled_links'
                base_filename = re.sub(r'[^a-z0-9_]', '', base_filename.lower())[:50]
                
                links_path = Path(output_dir) / f'{base_filename}.txt'
                counter = 1
                while links_path.exists():
                    links_path = Path(output_dir) / f'{base_filename}_copy{counter}.txt'
                    counter += 1

                links_content = "\n".join(result.get('internal_links', []))
                if links_content:
                    with open(links_path, 'w', encoding='utf-8') as f:
                        f.write(links_content)
            else:
                base_filename = re.sub(r'[^a-z0-9]', '_', result.get('title', result.get('h1', 'untitled')).lower())[:50]
                
                content_path = Path(output_dir) / f'{base_filename}.md'
                counter = 1
                while content_path.exists():
                    content_path = Path(output_dir) / f'{base_filename}_copy{counter}.md'
                    counter += 1

                markdown_content = f"# {result.get('title', 'Untitled')}\n\n"
                markdown_content += f"**URL:** {result.get('url', 'N/A')}\n\n"
                markdown_content += result.get('main_content', 'No main content found.')
                
                with open(content_path, 'w', encoding='utf-8') as f:
                    f.write(markdown_content)

        print(f"Scraping complete. Found {len(all_results)} items.", flush=True)
        return True, json.dumps(all_results)
            
    except Exception as e:
        error_msg = f"Scrapy task failed: {str(e)}"
        print(error_msg, flush=True)
        return False, error_msg
            
    finally:
        os.chdir(original_cwd)
        print(f"DEBUG: Changed directory back to: {os.getcwd()}", flush=True)
        
        if output_dir and (output_dir.startswith('/tmp/') or output_dir.startswith(tempfile.gettempdir())):
            try:
                shutil.rmtree(output_dir)
                print(f"Cleaned up temp directory: {output_dir}", flush=True)
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temp directory: {cleanup_error}", flush=True)

def main() -> None:
    if len(sys.argv) < 2:
        print("ERROR: Missing payload. Usage: python scrapy_worker.py <JSON_PAYLOAD>", flush=True)
        sys.exit(1)
    
    try:
        payload = json.loads(sys.argv[1])
    except (json.JSONDecodeError, IndexError) as e:
        print(f"ERROR: Invalid JSON payload: {e}", flush=True)
        sys.exit(1)
    
    task = payload.get('task', '').lower()
    urls = payload.get('urls', [])
    scrape_type = payload.get('scrapeType', 'content')
    max_pages = payload.get('maxPages', len(urls))
    output_dir = payload.get('outputDir', None)
    
    if task == "scrape":
        if not urls or len(urls) == 0:
            print("ERROR: scrape command requires a list of URLs", flush=True)
            sys.exit(1)
        
        success, result = run_scrapy_task(task, urls, scrape_type, max_pages, output_dir)
        
        if success:
            print(json.dumps({"success": True, "data": result}), flush=True)
        else:
            print(json.dumps({"success": False, "error": result}), flush=True)
            sys.exit(1)
    
    elif task == "analyze":
        print(json.dumps({"success": False, "error": "Analyze command not yet implemented."}), flush=True)
        sys.exit(1)
    
    else:
        print(json.dumps({"success": False, "error": f"Unknown task '{task}'. Supported: scrape, analyze"}), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
