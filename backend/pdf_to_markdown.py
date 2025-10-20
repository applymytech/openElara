import sys
import json
import os
import traceback
from typing import Dict, Any, List

import pymupdf
from PIL import Image
import pytesseract


def extract_text_from_pdf(pdf_path: str, use_ocr: bool = False) -> Dict[str, Any]:
    try:
        doc = pymupdf.open(pdf_path)
        
        pages_text: List[str] = []
        total_chars = 0
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            if not text.strip() and use_ocr:
                text = ocr_page(page)
            
            if text.strip():
                pages_text.append(f"# Page {page_num + 1}\n\n{text}\n")
                total_chars += len(text)
        
        doc.close()
        
        full_text = '\n'.join(pages_text)
        
        return {
            'success': True,
            'text': full_text,
            'pages': len(pages_text),
            'total_characters': total_chars,
            'used_ocr': use_ocr
        }
    
    except FileNotFoundError:
        return {'success': False, 'error': f'PDF file not found: {pdf_path}'}
    except Exception as e:
        return {'success': False, 'error': f'Failed to extract text: {str(e)}'}


def ocr_page(page: Any) -> str:
    try:
        pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))
        
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)  # type: ignore
        
        text = pytesseract.image_to_string(img)
        return text
    
    except Exception as e:
        return f"[OCR FAILED: {str(e)}]"


def clean_and_format_markdown(text: str) -> str:
    lines = text.split('\n')
    cleaned_lines: List[str] = []
    
    for line in lines:
        line = line.strip()
        
        if not line:
            continue
        
        if line.isupper() and len(line) < 60:
            cleaned_lines.append(f"\n## {line.title()}\n")
        elif line.startswith(('•', '·', '-', '*')) or (len(line) > 2 and line[1] in '.)'  and line[0].isdigit()):
            cleaned_lines.append(f"- {line.lstrip('•·-* ').lstrip('0123456789.)').strip()}")
        else:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def pdf_to_markdown(pdf_path: str, output_path: str, use_ocr: bool = False, clean_format: bool = True) -> Dict[str, Any]:
    try:
        extraction: Dict[str, Any] = extract_text_from_pdf(pdf_path, use_ocr)
        
        if not extraction['success']:
            return extraction
        
        text: str = extraction['text']
        
        if clean_format:
            text = clean_and_format_markdown(text)
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        return {
            'success': True,
            'output_path': output_path,
            'pages': extraction['pages'],
            'characters': extraction['total_characters'],
            'used_ocr': extraction.get('used_ocr', False),
            'message': f'Successfully converted {extraction["pages"]} pages to Markdown'
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': f'PDF to Markdown conversion failed: {str(e)}'
        }


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        
        input_path = input_data.get('input')
        output_path = input_data.get('output')
        use_ocr = input_data.get('use_ocr', False)
        clean_format = input_data.get('clean_format', True)
        
        if not input_path or not output_path:
            print(json.dumps({
                'success': False,
                'error': 'Missing input or output path'
            }))
            return
        
        result = pdf_to_markdown(input_path, output_path, use_ocr, clean_format)
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
