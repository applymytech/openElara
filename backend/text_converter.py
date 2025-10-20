"""
Universal Text File Converter
Converts between various text-based file formats using Markdown as an intermediary
Supports: TXT, MD, HTML, RTF, DOCX (via existing workers)
"""

import sys
import json
import os
import traceback
from pathlib import Path
from typing import Any, Dict, List, Union


SUPPORTED_FORMATS = ['txt', 'md', 'markdown', 'html', 'htm', 'rtf', 'docx', 'doc']


def text_to_markdown(text: str, source_format: str) -> str:
    if source_format in ['txt', 'md', 'markdown']:
        return text
    
    if source_format in ['html', 'htm']:
        import re
        text = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1', text, flags=re.IGNORECASE)
        text = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1', text, flags=re.IGNORECASE)
        text = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1', text, flags=re.IGNORECASE)
        text = re.sub(r'<strong>(.*?)</strong>', r'**\1**', text, flags=re.IGNORECASE)
        text = re.sub(r'<b>(.*?)</b>', r'**\1**', text, flags=re.IGNORECASE)
        text = re.sub(r'<em>(.*?)</em>', r'*\1*', text, flags=re.IGNORECASE)
        text = re.sub(r'<i>(.*?)</i>', r'*\1*', text, flags=re.IGNORECASE)
        text = re.sub(r'<code>(.*?)</code>', r'`\1`', text, flags=re.IGNORECASE)
        text = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1', text, flags=re.IGNORECASE)
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]+>', '', text)
        return text
    
    return text


def markdown_to_html(markdown_text: str) -> str:
    import re
    
    html: str = markdown_text
    
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'### \1', html, flags=re.MULTILINE)
    
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)
    
    html = re.sub(r'^- (.*?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    html = re.sub(r'(<li>.*?</li>(\n<li>.*?</li>)*)', r'<ul>\n\1\n</ul>', html, flags=re.DOTALL)
    
    paragraphs: List[str] = html.split('\n\n')
    formatted_paragraphs: List[str] = []
    for p in paragraphs:
        p = p.strip()
        if p and not p.startswith('<'):
            p = f'<p>{p}</p>'
        if p:
            formatted_paragraphs.append(p)
    
    html = '\n'.join(formatted_paragraphs)
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Converted Document</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
        code {{ background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }}
    </style>
</head>
<body>
{html}
</body>
</html>"""
    
    return html


def convert_text_file(input_path: str, output_path: str, output_format: str) -> Dict[str, Any]:
    try:
        input_ext: str = Path(input_path).suffix.lower().lstrip('.')
        output_ext: str = output_format.lower().lstrip('.')
        
        if input_ext not in SUPPORTED_FORMATS:
            return {
                'success': False,
                'error': f'Unsupported input format: {input_ext}. Supported: {", ".join(SUPPORTED_FORMATS)}'
            }
        
        if output_ext not in SUPPORTED_FORMATS:
            return {
                'success': False,
                'error': f'Unsupported output format: {output_ext}. Supported: {", ".join(SUPPORTED_FORMATS)}'
            }
        
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
            input_text: str = f.read()
        
        markdown_text: str = text_to_markdown(input_text, input_ext)
        
        if output_ext in ['txt']:
            import re
            output_text: str = re.sub(r'[#*`]', '', markdown_text)
        
        elif output_ext in ['md', 'markdown']:
            output_text: str = markdown_text
        
        elif output_ext in ['html', 'htm']:
            output_text: str = markdown_to_html(markdown_text)
        
        elif output_ext in ['docx', 'doc']:
            temp_md: str = output_path + '.temp.md'
            with open(temp_md, 'w', encoding='utf-8') as f:
                f.write(markdown_text)
            
            import subprocess
            
            payload: Dict[str, str] = {
                'input': temp_md,
                'output': output_path
            }
            
            result = subprocess.run(
                ['python', 'backend/markdown_to_docx.py'],
                input=json.dumps(payload),
                capture_output=True,
                text=True
            )
            
            if os.path.exists(temp_md):
                os.remove(temp_md)
            
            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                return {
                    'success': False,
                    'error': f'DOCX conversion failed: {result.stderr}'
                }
        
        else:
            return {
                'success': False,
                'error': f'Conversion to {output_ext} not yet implemented'
            }
        
        if output_ext not in ['docx', 'doc']:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(output_text)
        
        return {
            'success': True,
            'output_path': output_path,
            'message': f'Successfully converted {input_ext.upper()} to {output_ext.upper()}'
        }
    
    except FileNotFoundError:
        return {'success': False, 'error': f'Input file not found: {input_path}'}
    except Exception as e:
        return {
            'success': False,
            'error': f'Text conversion failed: {str(e)}',
            'traceback': traceback.format_exc()
        }


def main() -> None:
    try:
        input_data: Dict[str, Any] = json.loads(sys.stdin.read())
        
        input_path: Union[str, None] = input_data.get('input')
        output_path: Union[str, None] = input_data.get('output')
        output_format: Union[str, None] = input_data.get('output_format')
        
        if not input_path or not output_path or not output_format:
            print(json.dumps({
                'success': False,
                'error': 'Missing input, output, or output_format'
            }))
            return
        
        result: Dict[str, Any] = convert_text_file(input_path, output_path, output_format)
        print(json.dumps(result), flush=True)
    
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }), file=sys.stderr, flush=True)
    
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'traceback': traceback.format_exc()
        }), file=sys.stderr, flush=True)


if __name__ == '__main__':
    main()
