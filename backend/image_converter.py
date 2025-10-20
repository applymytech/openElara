import sys
import json
import os
from pathlib import Path
from PIL import Image
import traceback
from typing import Dict, Any, List


SUPPORTED_FORMATS = {
    'png': 'PNG',
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'bmp': 'BMP',
    'gif': 'GIF',
    'tiff': 'TIFF',
    'tif': 'TIFF',
    'webp': 'WEBP',
    'ico': 'ICO',
    'pdf': 'PDF'
}


def convert_image(input_path: str, output_path: str, output_format: str, quality: int = 95) -> Dict[str, Any]:
    try:
        output_ext: str = output_format.lower().lstrip('.')
        if output_ext not in SUPPORTED_FORMATS:
            return {
                'success': False,
                'error': f'Unsupported output format: {output_format}. Supported: {", ".join(SUPPORTED_FORMATS.keys())}'
            }
        
        with Image.open(input_path) as img:
            pil_format = SUPPORTED_FORMATS[output_ext]
            
            if pil_format in ['JPEG', 'BMP', 'PDF'] and img.mode in ['RGBA', 'LA', 'P']:
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif pil_format == 'PDF' and img.mode not in ['RGB', 'L']:
                img = img.convert('RGB')
            elif img.mode not in ['RGB', 'RGBA', 'L']:
                img = img.convert('RGB')
            
            save_kwargs: Dict[str, Any] = {'format': pil_format}
            
            if pil_format == 'JPEG':
                save_kwargs['quality'] = quality
                save_kwargs['optimize'] = True
            elif pil_format == 'PNG':
                save_kwargs['optimize'] = True
            elif pil_format == 'WEBP':
                save_kwargs['quality'] = quality
            elif pil_format == 'PDF':
                save_kwargs['resolution'] = 100.0
                save_kwargs['save_all'] = False
            
            img.save(output_path, **save_kwargs)
        
        return {
            'success': True,
            'output_path': output_path,
            'message': f'Successfully converted to {output_format.upper()}'
        }
    
    except FileNotFoundError:
        return {'success': False, 'error': f'Input file not found: {input_path}'}
    except Exception as e:
        return {'success': False, 'error': f'Conversion failed: {str(e)}'}


def batch_convert_images(input_files: List[str], output_dir: str, output_format: str, quality: int = 95) -> Dict[str, Any]:
    results: Dict[str, Any] = {
        'success': True,
        'converted': [],
        'failed': [],
        'total': len(input_files)
    }
    
    os.makedirs(output_dir, exist_ok=True)
    
    for input_path in input_files:
        try:
            input_file = Path(input_path)
            output_filename = input_file.stem + '.' + output_format.lower().lstrip('.')
            output_path = os.path.join(output_dir, output_filename)
            
            result = convert_image(input_path, output_path, output_format, quality)
            
            if result['success']:
                results['converted'].append({
                    'input': input_path,
                    'output': output_path,
                    'filename': output_filename
                })
            else:
                results['failed'].append({
                    'input': input_path,
                    'error': result['error']
                })
                results['success'] = False
        
        except Exception as e:
            results['failed'].append({
                'input': input_path,
                'error': str(e)
            })
            results['success'] = False
    
    results['message'] = f'Converted {len(results["converted"])}/{results["total"]} images'
    return results


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        
        mode = input_data.get('mode', 'single')
        output_format = input_data.get('output_format', 'png')
        quality = input_data.get('quality', 95)
        
        result: Dict[str, Any]
        
        if mode == 'single':
            input_path = input_data.get('input')
            output_path = input_data.get('output_path')
            
            if not input_path or not output_path:
                print(json.dumps({
                    'success': False,
                    'error': 'Missing input or output_path for single mode'
                }))
                return
            
            result = convert_image(input_path, output_path, output_format, quality)
        
        elif mode == 'batch':
            input_files = input_data.get('input', [])
            output_dir = input_data.get('output_dir')
            
            if not input_files or not output_dir:
                print(json.dumps({
                    'success': False,
                    'error': 'Missing input files or output_dir for batch mode'
                }))
                return
            
            result = batch_convert_images(input_files, output_dir, output_format, quality)
        
        else:
            result = {
                'success': False,
                'error': f'Invalid mode: {mode}. Use "single" or "batch"'
            }
        
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
