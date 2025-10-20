"""
Watermark Worker Module
========================
Extract and verify watermark metadata from images and videos.

Dependencies: Pillow, piexif (optional), ffmpeg (for videos)
"""

from PIL import Image
import os
import json
from pathlib import Path
import hashlib

# Try to import piexif for better EXIF handling
try:
    import piexif
    HAS_PIEXIF = True
except ImportError:
    HAS_PIEXIF = False


def extract_watermark(file_path):
    """
    Extract watermark data from image or video.
    
    Args:
        file_path (str): Path to media file
    
    Returns:
        dict: {
            'success': bool,
            'has_watermark': bool,
            'data': dict,
            'message': str
        }
    """
    try:
        file_ext = Path(file_path).suffix.lower()
        
        # Determine file type
        image_exts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
        video_exts = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
        
        if file_ext in image_exts:
            return extract_image_watermark(file_path)
        elif file_ext in video_exts:
            return extract_video_watermark(file_path)
        else:
            return {
                'success': False,
                'has_watermark': False,
                'data': {},
                'message': f"Unsupported file type: {file_ext}"
            }
    
    except Exception as e:
        return {
            'success': False,
            'has_watermark': False,
            'data': {},
            'message': str(e)
        }


def extract_image_watermark(file_path):
    """Extract watermark from image file"""
    try:
        img = Image.open(file_path)
        
        # Get EXIF data
        exif_data = {}
        has_watermark = False
        
        if hasattr(img, '_getexif') and img._getexif() is not None:
            raw_exif = img._getexif()
            exif_data = {str(k): str(v) for k, v in raw_exif.items()}
        
        # Get PIL info dict (often contains custom metadata)
        info_data = dict(img.info)
        
        # Check for OpenElara watermark fields
        watermark_fields = [
            'Generator',
            'generator',
            'ImageDescription',
            'UserComment',
            'Artist',
            'Copyright',
            'Software',
            'openelara_uuid',
            'model_name',
            'generation_timestamp'
        ]
        
        found_fields = {}
        for field in watermark_fields:
            if field in info_data:
                found_fields[field] = info_data[field]
                if 'openelara' in str(info_data[field]).lower():
                    has_watermark = True
            if field in exif_data:
                found_fields[field] = exif_data[field]
                if 'openelara' in str(exif_data[field]).lower():
                    has_watermark = True
        
        # Check for sidecar JSON file
        sidecar_json = None
        json_path = file_path + '.json'
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                sidecar_json = json.load(f)
                if sidecar_json.get('generator') == 'OpenElara':
                    has_watermark = True
        
        # Calculate content hash
        content_hash = calculate_file_hash(file_path)
        
        # Compile data
        data = {
            'file_path': file_path,
            'file_type': 'image',
            'file_size': os.path.getsize(file_path),
            'format': img.format,
            'dimensions': f"{img.width}x{img.height}",
            'mode': img.mode,
            'metadata': {**exif_data, **info_data},
            'watermark_fields': found_fields,
            'sidecar_json': sidecar_json,
            'content_hash': content_hash
        }
        
        return {
            'success': True,
            'has_watermark': has_watermark,
            'data': data,
            'message': 'Successfully extracted metadata'
        }
    
    except Exception as e:
        return {
            'success': False,
            'has_watermark': False,
            'data': {},
            'message': f"Image extraction error: {str(e)}"
        }


def extract_video_watermark(file_path):
    """Extract watermark from video file (requires ffmpeg)"""
    try:
        # Check for sidecar JSON file
        sidecar_json = None
        json_path = file_path + '.json'
        has_watermark = False
        
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                sidecar_json = json.load(f)
                if sidecar_json.get('generator') == 'OpenElara':
                    has_watermark = True
        
        # Try to extract ffmpeg metadata (basic implementation)
        # Note: Full ffmpeg integration would require subprocess call
        metadata = {}
        
        try:
            import subprocess
            result = subprocess.run(
                ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', file_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                ffprobe_data = json.loads(result.stdout)
                if 'format' in ffprobe_data and 'tags' in ffprobe_data['format']:
                    metadata = ffprobe_data['format']['tags']
                    
                    # Check for OpenElara watermark
                    for key, value in metadata.items():
                        if 'openelara' in str(value).lower():
                            has_watermark = True
        
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # ffprobe not available or timed out
            metadata = {'note': 'ffprobe not available - limited metadata extraction'}
        
        # Calculate content hash
        content_hash = calculate_file_hash(file_path)
        
        # Compile data
        data = {
            'file_path': file_path,
            'file_type': 'video',
            'file_size': os.path.getsize(file_path),
            'metadata': metadata,
            'sidecar_json': sidecar_json,
            'content_hash': content_hash
        }
        
        return {
            'success': True,
            'has_watermark': has_watermark,
            'data': data,
            'message': 'Successfully extracted metadata'
        }
    
    except Exception as e:
        return {
            'success': False,
            'has_watermark': False,
            'data': {},
            'message': f"Video extraction error: {str(e)}"
        }


def calculate_file_hash(file_path, algorithm='sha256', chunk_size=8192):
    """Calculate file hash"""
    hasher = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    
    return hasher.hexdigest()


def format_summary(data):
    """Format summary view"""
    if not data:
        return "No data to display"
    
    has_watermark = data.get('watermark_fields') or data.get('sidecar_json')
    
    summary = f"""
╔════════════════════════════════════════════════════════════╗
║                   WATERMARK ANALYSIS                       ║
╚════════════════════════════════════════════════════════════╝

📄 File Information:
   Path: {data.get('file_path', 'N/A')}
   Type: {data.get('file_type', 'N/A').upper()}
   Size: {data.get('file_size', 0) / 1024:.2f} KB
   Hash: {data.get('content_hash', 'N/A')[:16]}...

"""
    
    if has_watermark:
        summary += "🔒 Watermark Status: DETECTED ✅\n\n"
        
        # Extract watermark details
        watermark = data.get('watermark_fields', {})
        sidecar = data.get('sidecar_json', {})
        
        if watermark or sidecar:
            summary += "📋 Watermark Details:\n"
            
            # Generator
            generator = watermark.get('Generator') or watermark.get('generator') or sidecar.get('generator')
            if generator:
                summary += f"   Generator: {generator}\n"
            
            # UUID
            uuid = watermark.get('openelara_uuid') or sidecar.get('installation_uuid')
            if uuid:
                summary += f"   Installation UUID: {uuid}\n"
            
            # Model
            model = watermark.get('model_name') or sidecar.get('model')
            if model:
                summary += f"   Model: {model}\n"
            
            # Timestamp
            timestamp = watermark.get('generation_timestamp') or sidecar.get('timestamp')
            if timestamp:
                summary += f"   Timestamp: {timestamp}\n"
            
            # Prompt hash
            prompt_hash = sidecar.get('prompt_hash')
            if prompt_hash:
                summary += f"   Prompt Hash: {prompt_hash[:16]}...\n"
            
            summary += "\n"
    else:
        summary += "⚠️  Watermark Status: NOT DETECTED\n\n"
        summary += "   This file does not appear to have OpenElara watermark\n"
        summary += "   metadata. It may have been generated elsewhere or\n"
        summary += "   the metadata was stripped during processing.\n\n"
    
    # Image-specific info
    if data.get('file_type') == 'image':
        summary += f"🖼️  Image Properties:\n"
        summary += f"   Format: {data.get('format', 'N/A')}\n"
        summary += f"   Dimensions: {data.get('dimensions', 'N/A')}\n"
        summary += f"   Mode: {data.get('mode', 'N/A')}\n"
    
    summary += "\n" + "=" * 60 + "\n"
    
    return summary


def format_metadata(metadata):
    """Format metadata view"""
    if not metadata:
        return "No metadata found"
    
    output = "RAW METADATA DUMP\n"
    output += "=" * 60 + "\n\n"
    
    for key, value in metadata.items():
        # Truncate long values
        value_str = str(value)
        if len(value_str) > 100:
            value_str = value_str[:97] + "..."
        
        output += f"{key}:\n  {value_str}\n\n"
    
    return output


def format_json(json_data):
    """Format JSON sidecar view"""
    if not json_data:
        return "No sidecar JSON file found.\n\nSidecar JSON files are created alongside images/videos\nand contain the complete watermark metadata."
    
    return json.dumps(json_data, indent=2)


def format_verification(data):
    """Format verification view"""
    output = "WATERMARK VERIFICATION\n"
    output += "=" * 60 + "\n\n"
    
    has_watermark = bool(data.get('watermark_fields') or data.get('sidecar_json'))
    
    if has_watermark:
        output += "✅ Status: WATERMARK DETECTED\n\n"
        
        output += "Verification Checks:\n"
        output += f"  [{'✓' if data.get('watermark_fields') else '✗'}] EXIF/Metadata watermark\n"
        output += f"  [{'✓' if data.get('sidecar_json') else '✗'}] Sidecar JSON file\n"
        
        # Verify content hash
        if data.get('sidecar_json'):
            sidecar = data['sidecar_json']
            stored_hash = sidecar.get('content_hash')
            calculated_hash = data.get('content_hash')
            
            output += f"\n  Content Hash Verification:\n"
            if stored_hash and calculated_hash:
                if stored_hash == calculated_hash:
                    output += f"    ✅ MATCH - File integrity verified\n"
                    output += f"    Hash: {calculated_hash[:32]}...\n"
                else:
                    output += f"    ⚠️  MISMATCH - File may have been modified\n"
                    output += f"    Stored:     {stored_hash[:32]}...\n"
                    output += f"    Calculated: {calculated_hash[:32]}...\n"
            else:
                output += f"    ⚠️  Hash not available for verification\n"
        
        output += "\n\nEthical AI Notice:\n"
        output += "  This content was generated by OpenElara, an ethical AI\n"
        output += "  assistant that automatically watermarks all generated\n"
        output += "  media for transparency and traceability.\n"
    
    else:
        output += "⚠️  Status: NO WATERMARK DETECTED\n\n"
        output += "This file does not contain OpenElara watermark metadata.\n"
        output += "Possible reasons:\n"
        output += "  • File was not generated by OpenElara\n"
        output += "  • Metadata was stripped during processing\n"
        output += "  • File was edited with tools that remove EXIF\n"
        output += "  • Watermarking feature was disabled (unlikely)\n"
    
    return output


def check_dependencies():
    """Check if required dependencies are installed"""
    missing = []
    
    try:
        import PIL
    except ImportError:
        missing.append('Pillow')
    
    return len(missing) == 0, missing


if __name__ == "__main__":
    # Test script
    print("Watermark Worker Module")
    print("=" * 50)
    
    ready, missing = check_dependencies()
    if ready:
        print("✓ All dependencies installed")
    else:
        print(f"✗ Missing dependencies: {', '.join(missing)}")
        print("  Run: pip install Pillow")
