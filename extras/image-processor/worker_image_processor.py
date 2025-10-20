"""
Image Processor Worker Module
==============================
Core image processing functions.

Operations:
- Convert: Change image format
- Resize: Scale images with aspect ratio
- Compress: Reduce file size with quality control
- Enhance: Adjust brightness, contrast, sharpness
- Rotate: Rotate images by specified angle
- Crop: Crop images to specified dimensions

Dependencies: Pillow
"""

from PIL import Image, ImageEnhance, ImageOps
import os
from pathlib import Path


def process_image(file_path, output_folder, operation, settings):
    """
    Process a single image based on operation and settings.
    
    Args:
        file_path (str): Path to input image
        output_folder (str): Path to output folder
        operation (str): Operation type (convert/resize/compress/enhance/rotate/crop)
        settings (dict): Operation-specific settings
    
    Returns:
        dict: {'success': bool, 'message': str, 'output_path': str}
    """
    try:
        # Load image
        img = Image.open(file_path)
        original_format = img.format
        
        # Get filename without extension
        filename = Path(file_path).stem
        
        # Process based on operation
        if operation == "convert":
            output_img, output_ext = convert_format(img, settings)
        
        elif operation == "resize":
            output_img, output_ext = resize_image(img, settings, original_format)
        
        elif operation == "compress":
            output_img, output_ext = compress_image(img, settings, original_format)
        
        elif operation == "enhance":
            output_img, output_ext = enhance_image(img, settings, original_format)
        
        elif operation == "rotate":
            output_img, output_ext = rotate_image(img, settings, original_format)
        
        elif operation == "crop":
            output_img, output_ext = crop_image(img, settings, original_format)
        
        else:
            return {
                'success': False,
                'message': f"Unknown operation: {operation}",
                'output_path': None
            }
        
        # Generate output filename
        output_filename = f"{filename}_processed.{output_ext.lower()}"
        output_path = os.path.join(output_folder, output_filename)
        
        # Ensure unique filename
        counter = 1
        while os.path.exists(output_path):
            output_filename = f"{filename}_processed_{counter}.{output_ext.lower()}"
            output_path = os.path.join(output_folder, output_filename)
            counter += 1
        
        # Save image
        save_kwargs = {}
        if output_ext.upper() in ['JPG', 'JPEG']:
            save_kwargs['quality'] = settings.get('quality', 95)
            save_kwargs['optimize'] = True
            # Convert to RGB if necessary (JPEG doesn't support transparency)
            if output_img.mode in ['RGBA', 'LA', 'P']:
                background = Image.new('RGB', output_img.size, (255, 255, 255))
                if output_img.mode == 'P':
                    output_img = output_img.convert('RGBA')
                background.paste(output_img, mask=output_img.split()[-1] if output_img.mode in ['RGBA', 'LA'] else None)
                output_img = background
        
        elif output_ext.upper() == 'PNG':
            save_kwargs['optimize'] = True
        
        elif output_ext.upper() == 'WEBP':
            save_kwargs['quality'] = settings.get('quality', 90)
            save_kwargs['method'] = 6  # Best compression
        
        output_img.save(output_path, format=output_ext.upper(), **save_kwargs)
        
        # Get file size for reporting
        size_kb = os.path.getsize(output_path) / 1024
        
        return {
            'success': True,
            'message': f"Saved to {output_filename} ({size_kb:.1f} KB)",
            'output_path': output_path
        }
    
    except Exception as e:
        return {
            'success': False,
            'message': str(e),
            'output_path': None
        }


def convert_format(img, settings):
    """Convert image to different format"""
    target_format = settings.get('format', 'PNG').upper()
    
    # Determine file extension
    ext_map = {
        'JPG': 'jpg',
        'JPEG': 'jpg',
        'PNG': 'png',
        'WEBP': 'webp',
        'BMP': 'bmp',
        'TIFF': 'tiff',
        'GIF': 'gif'
    }
    
    output_ext = ext_map.get(target_format, 'png')
    
    return img, output_ext


def resize_image(img, settings, original_format):
    """Resize image with optional aspect ratio preservation"""
    try:
        width = int(settings.get('width', 1920))
        height = int(settings.get('height', 1080))
        maintain_aspect = settings.get('aspect_ratio', True)
        
        if maintain_aspect:
            # Calculate aspect ratio
            img.thumbnail((width, height), Image.Resampling.LANCZOS)
            output_img = img
        else:
            # Force resize to exact dimensions
            output_img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # Keep original format
        ext_map = {
            'JPEG': 'jpg',
            'PNG': 'png',
            'WEBP': 'webp',
            'BMP': 'bmp',
            'TIFF': 'tiff',
            'GIF': 'gif'
        }
        output_ext = ext_map.get(original_format, 'png')
        
        return output_img, output_ext
    
    except ValueError as e:
        raise ValueError(f"Invalid dimensions: {e}")


def compress_image(img, settings, original_format):
    """Compress image with quality setting"""
    quality = int(settings.get('quality', 85))
    
    # Keep original format
    ext_map = {
        'JPEG': 'jpg',
        'PNG': 'png',
        'WEBP': 'webp',
        'BMP': 'bmp',
        'TIFF': 'tiff',
        'GIF': 'gif'
    }
    output_ext = ext_map.get(original_format, 'png')
    
    # For PNG, we'll just optimize (quality doesn't apply)
    # For JPEG/WEBP, quality is applied during save
    
    return img, output_ext


def enhance_image(img, settings, original_format):
    """Enhance image (brightness, contrast, sharpness)"""
    output_img = img
    
    # Apply brightness
    brightness = float(settings.get('brightness', 1.0))
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(output_img)
        output_img = enhancer.enhance(brightness)
    
    # Apply contrast
    contrast = float(settings.get('contrast', 1.0))
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(output_img)
        output_img = enhancer.enhance(contrast)
    
    # Apply sharpness
    sharpness = float(settings.get('sharpness', 1.0))
    if sharpness != 1.0:
        enhancer = ImageEnhance.Sharpness(output_img)
        output_img = enhancer.enhance(sharpness)
    
    # Keep original format
    ext_map = {
        'JPEG': 'jpg',
        'PNG': 'png',
        'WEBP': 'webp',
        'BMP': 'bmp',
        'TIFF': 'tiff',
        'GIF': 'gif'
    }
    output_ext = ext_map.get(original_format, 'png')
    
    return output_img, output_ext


def rotate_image(img, settings, original_format):
    """Rotate image by specified angle"""
    angle_str = settings.get('angle', '90')
    
    try:
        angle = int(angle_str)
    except ValueError:
        angle = 90  # Default to 90 if invalid
    
    # Rotate image (counter-clockwise, so negate for clockwise)
    output_img = img.rotate(-angle, expand=True, fillcolor='white')
    
    # Keep original format
    ext_map = {
        'JPEG': 'jpg',
        'PNG': 'png',
        'WEBP': 'webp',
        'BMP': 'bmp',
        'TIFF': 'tiff',
        'GIF': 'gif'
    }
    output_ext = ext_map.get(original_format, 'png')
    
    return output_img, output_ext


def crop_image(img, settings, original_format):
    """Crop image to specified dimensions"""
    try:
        left = int(settings.get('left', 0))
        top = int(settings.get('top', 0))
        right = int(settings.get('right', img.width))
        bottom = int(settings.get('bottom', img.height))
        
        # Validate dimensions
        if left < 0 or top < 0 or right > img.width or bottom > img.height:
            raise ValueError("Crop dimensions out of bounds")
        
        if left >= right or top >= bottom:
            raise ValueError("Invalid crop dimensions (left >= right or top >= bottom)")
        
        # Crop image
        output_img = img.crop((left, top, right, bottom))
        
        # Keep original format
        ext_map = {
            'JPEG': 'jpg',
            'PNG': 'png',
            'WEBP': 'webp',
            'BMP': 'bmp',
            'TIFF': 'tiff',
            'GIF': 'gif'
        }
        output_ext = ext_map.get(original_format, 'png')
        
        return output_img, output_ext
    
    except ValueError as e:
        raise ValueError(f"Crop error: {e}")


def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        import PIL
        return True
    except ImportError:
        return False


if __name__ == "__main__":
    # Test script
    print("Image Processor Worker Module")
    print("=" * 50)
    
    if check_dependencies():
        print("✓ All dependencies installed")
    else:
        print("✗ Missing dependencies. Run: pip install Pillow")
