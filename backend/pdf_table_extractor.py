import sys
import json
import os
from pathlib import Path
import traceback
from typing import Dict, Any, Optional, List

try:
    import tabula
    tabula_available = True
except ImportError:
    tabula_available = False


def extract_tables_from_pdf(pdf_path: str, output_format: str = 'csv', output_dir: Optional[str] = None) -> Dict[str, Any]:
    try:
        if not tabula_available:
            return {
                'success': False,
                'error': 'tabula-py not available. Install: pip install tabula-py'
            }
        
        if not output_dir:
            output_dir = os.path.dirname(pdf_path)
        
        os.makedirs(output_dir, exist_ok=True)
        
        tables = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True)  # type: ignore
        
        if not tables:
            return {
                'success': False,
                'error': 'No tables found in PDF'
            }
        
        saved_files: List[Dict[str, Any]] = []
        base_name: str = Path(pdf_path).stem
        
        for i, table in enumerate(tables, 1):
            if output_format.lower() == 'xlsx':
                output_file = os.path.join(output_dir, f"{base_name}_table_{i}.xlsx")
                table.to_excel(output_file, index=False)  # type: ignore
            else:
                output_file = os.path.join(output_dir, f"{base_name}_table_{i}.csv")
                table.to_csv(output_file, index=False)  # type: ignore
            
            saved_files.append({
                'file': output_file,
                'rows': len(table),
                'columns': len(table.columns)  # type: ignore
            })
        
        return {
            'success': True,
            'tables_found': len(tables),
            'files': saved_files,
            'message': f'Extracted {len(tables)} table(s) from PDF'
        }
    
    except FileNotFoundError:
        return {'success': False, 'error': f'PDF file not found: {pdf_path}'}
    except Exception as e:
        return {
            'success': False,
            'error': f'Table extraction failed: {str(e)}'
        }


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        
        input_path = input_data.get('input')
        output_format = input_data.get('output_format', 'csv')
        output_dir = input_data.get('output_dir')
        
        if not input_path:
            print(json.dumps({
                'success': False,
                'error': 'Missing input path'
            }))
            return
        
        result = extract_tables_from_pdf(input_path, output_format, output_dir)
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
