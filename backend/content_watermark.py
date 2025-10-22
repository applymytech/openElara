import subprocess
import os
import hashlib
import json
import uuid
import sys
from datetime import datetime
from typing import Dict, Optional, Any
from PIL import Image
from PIL.PngImagePlugin import PngInfo


class ContentWatermark:
    def __init__(self, config_path: Optional[str] = None, app_version: str = "1.0.0"):
        self.app_version = app_version
        self.config_path = config_path if config_path is not None else os.path.join(
            os.path.expanduser('~'), '.openelara', 'watermark_config.json'
        )
        self.installation_id = self._get_or_create_installation_id()

    def _get_or_create_installation_id(self) -> str:
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                config = json.load(f)
                return config.get('installation_id')
        installation_id = str(uuid.uuid4())
        config = {
            'installation_id': installation_id,
            'created_at': datetime.now().isoformat(),
            'version': self.app_version,
            'privacy_notice': 'This ID is local only. It is never transmitted or shared.'
        }
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
        return installation_id

    def generate_content_signature(self, content_type: str, content_data: bytes) -> str:
        timestamp = datetime.now().isoformat()
        content_hash = hashlib.sha256(content_data).hexdigest()
        context = f"{self.installation_id}:{timestamp}:{content_type}"
        context_hash = hashlib.sha256(context.encode()).hexdigest()
        signature = hashlib.sha256(
            f"{content_hash}:{context_hash}".encode()
        ).hexdigest()
        return signature[:32]

    def create_watermark_metadata(self, 
            content_type: str,
            model_info: Dict[str, Any],
            generation_params: Dict[str, Any],
            content_hash: str) -> Dict[str, Any]:
        timestamp = datetime.now()
        metadata: Dict[str, Any] = {
            'generator': 'OpenElara',
            'version': self.app_version,
            'content_type': content_type,
            'generated_at': timestamp.isoformat(),
            'generated_at_unix': int(timestamp.timestamp()),
            'installation_id': self.installation_id,
            'content_signature': content_hash,
            'watermark_version': '1.0',
            'model': {
                'name': str(model_info.get('name', 'unknown')),
                'provider': str(model_info.get('provider', 'unknown')),
                'type': str(model_info.get('type', 'ai_model'))
            },
            'generation': {
                'prompt_hash': hashlib.sha256(
                    str(generation_params.get('prompt', '')).encode()
                ).hexdigest()[:16],
                'settings_present': bool(generation_params.get('settings')),
                'seed': generation_params.get('seed'),
            },
            'notice': 'AI-generated content. Created with OpenElara.',
            'disclaimer': 'This content was created with AI assistance. Verify information independently.',
            'privacy': 'No personal data collected. Installation ID is local only.',
            'provenance_id': str(uuid.uuid4()),
            'parent_id': generation_params.get('parent_id'),
        }
        return metadata


    def _get_mime_type(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.webp': 'image/webp'
        }
        return mime_types.get(ext, 'application/octet-stream')

    def embed_metadata_in_video(self, video_path: str, metadata: Dict[str, Any]) -> bool:
        try:
            metadata_file = video_path + '.metadata.txt'
            with open(metadata_file, 'w', encoding='utf-8') as f:
                f.write(';FFMETADATA1\n')
                
                f.write(f'title=AI Generated Content - OpenElara\n')
                f.write(f'artist=OpenElara v{str(metadata["version"])}\n')
                f.write(f'comment={str(metadata["notice"])}\n')
                f.write(f'description=AI-generated content with OpenElara. Metadata: {json.dumps(metadata)}\n')
                f.write(f'date={str(metadata["generated_at"])}\n')
                f.write(f'encoder=OpenElara v{str(metadata["version"])}\n')
                f.write(f'copyright=Generated with OpenElara - AI Content Assistant\n')
                f.write(f'genre=AI Generated\n')
                f.write(f'composer=OpenElara AI System\n')
                
                
                f.write(f'openelara_signature={str(metadata["content_signature"])}\n')
                f.write(f'openelara_model={str(metadata["model"]["name"])}\n')
                f.write(f'openelara_provider={str(metadata["model"]["provider"])}\n')
                f.write(f'openelara_provenance={str(metadata["provenance_id"])}\n')
                f.write(f'openelara_installation={str(metadata["installation_id"])}\n')
                f.write(f'openelara_content_type={str(metadata["content_type"])}\n')
            
            temp_output = video_path + '.watermarked.mp4'
            
            cmd = [
                'ffmpeg',
                '-i', video_path,
                '-i', metadata_file,
                '-map_metadata', '1',  
                '-movflags', '+faststart',  
                '-c', 'copy',  
                '-y',
                temp_output
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                os.replace(temp_output, video_path)
                os.remove(metadata_file)
                print(f"Successfully embedded metadata in video: {video_path}")
                return True
            else:
                print(f"FFmpeg failed with return code {result.returncode}")
                print(f"FFmpeg stdout: {result.stdout}")
                print(f"FFmpeg stderr: {result.stderr}")
                if os.path.exists(temp_output):
                    os.remove(temp_output)
                if os.path.exists(metadata_file):
                    os.remove(metadata_file)
                return False
        except Exception as e:
            print(f"Error embedding metadata in video {video_path}: {e}")
            return False

    def embed_metadata_in_image(self, image_path: str, metadata: Dict[str, Any]) -> bool:
        try:
            img = Image.open(image_path)
            
            file_ext = os.path.splitext(image_path)[1].lower()
            
            if file_ext in ('.png',):
                
                png_info = PngInfo()
                png_info.add_text('OpenElara:Generator', str(metadata['generator']))  # type: ignore
                png_info.add_text('OpenElara:Version', str(metadata['version']))  # type: ignore
                png_info.add_text('OpenElara:GeneratedAt', str(metadata['generated_at']))  # type: ignore
                png_info.add_text('OpenElara:Model', str(metadata['model']['name']))  # type: ignore
                png_info.add_text('OpenElara:Provider', str(metadata['model']['provider']))  # type: ignore
                png_info.add_text('OpenElara:Signature', str(metadata['content_signature']))  # type: ignore
                png_info.add_text('OpenElara:Notice', str(metadata['notice']))  # type: ignore
                png_info.add_text('OpenElara:ProvenanceID', str(metadata['provenance_id']))  # type: ignore
                png_info.add_text('OpenElara:Metadata', json.dumps(metadata))  # type: ignore
                img.save(image_path, format='PNG', pnginfo=png_info)
                return True
            elif file_ext in ('.jpg', '.jpeg'):
                
                exif_dict = img.getexif()
                exif_dict[0x9286] = json.dumps(metadata)
                exif_dict[0x0131] = f"OpenElara {metadata['version']}"
                exif_dict[0x013B] = "AI Generated - OpenElara"
                exif_dict[0x8298] = str(metadata['notice'])
                img.save(image_path, format='JPEG', exif=exif_dict, quality=95)
                return True
            else:
                
                img_format = img.format
                if img_format == 'PNG':
                    png_info = PngInfo()
                    png_info.add_text('OpenElara:Generator', str(metadata['generator']))  # type: ignore
                    png_info.add_text('OpenElara:Version', str(metadata['version']))  # type: ignore
                    png_info.add_text('OpenElara:GeneratedAt', str(metadata['generated_at']))  # type: ignore
                    png_info.add_text('OpenElara:Model', str(metadata['model']['name']))  # type: ignore
                    png_info.add_text('OpenElara:Provider', str(metadata['model']['provider']))  # type: ignore
                    png_info.add_text('OpenElara:Signature', str(metadata['content_signature']))  # type: ignore
                    png_info.add_text('OpenElara:Notice', str(metadata['notice']))  # type: ignore
                    png_info.add_text('OpenElara:ProvenanceID', str(metadata['provenance_id']))  # type: ignore
                    png_info.add_text('OpenElara:Metadata', json.dumps(metadata))  # type: ignore
                    img.save(image_path, format='PNG', pnginfo=png_info)
                    return True
                elif img_format == 'JPEG':
                    exif_dict = img.getexif()
                    exif_dict[0x9286] = json.dumps(metadata)
                    exif_dict[0x0131] = f"OpenElara {metadata['version']}"
                    exif_dict[0x013B] = "AI Generated - OpenElara"
                    exif_dict[0x8298] = str(metadata['notice'])
                    img.save(image_path, format='JPEG', exif=exif_dict, quality=95)
                    return True
                else:
                    return False
        except Exception as e:
            print(f"Error embedding metadata in image {image_path}: {e}")
            return False

    def create_sidecar_metadata_file(self, content_path: str, metadata: Dict[str, Any]):
        sidecar_path = content_path + '.openelara.json'
        try:
            with open(sidecar_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            print(f"Successfully created sidecar file: {sidecar_path}")
            return sidecar_path
        except Exception as e:
            print(f"Error creating sidecar file {sidecar_path}: {e}")
            raise

    def watermark_content(self,
            content_path: str,
            content_type: str,
            model_info: Dict[str, Any],
            generation_params: Dict[str, Any],
            embed_in_file: bool = True,
            use_c2pa: bool = True) -> Dict[str, Any]:
        print(f"Starting watermark_content for {content_path} with content_type: {content_type}")
        with open(content_path, 'rb') as f:
            content_data = f.read()
        signature = self.generate_content_signature(content_type, content_data)
        metadata = self.create_watermark_metadata(
            content_type=content_type,
            model_info=model_info,
            generation_params=generation_params,
            content_hash=signature
        )
        print(f"Created metadata: {metadata}")
        if embed_in_file:
            if content_type == 'image':
                print(f"Embedding metadata in image: {content_path}")
                self.embed_metadata_in_image(content_path, metadata)
            elif content_type == 'video':
                print(f"Embedding metadata in video: {content_path}")
                self.embed_metadata_in_video(content_path, metadata)
        
        
        metadata['c2pa_signed'] = False
                
        print(f"Creating sidecar metadata file for: {content_path}")
        sidecar_path = self.create_sidecar_metadata_file(content_path, metadata)
        print(f"Sidecar file created at: {sidecar_path}")
        return metadata

    def verify_watermark(self, content_path: str) -> Optional[Dict[str, Any]]:
        
        sidecar_path = content_path + '.openelara.json'
        if os.path.exists(sidecar_path):
            try:
                with open(sidecar_path, 'r') as f:
                    metadata = json.load(f)
                    print(f"Found sidecar metadata: {sidecar_path}")
                    return metadata
            except Exception as e:
                print(f"Error reading sidecar file {sidecar_path}: {e}")
                pass
        
        
        try:
            img = Image.open(content_path)
            if content_path.lower().endswith('.png'):
                meta = img.info.get('OpenElara:Metadata')
                if meta:
                    result = json.loads(meta)
                    print(f"Found PNG embedded metadata: {result}")
                    return result
            elif content_path.lower().endswith(('.jpg', '.jpeg')):
                exif_dict = img.getexif()
                meta = exif_dict.get(0x9286)  
                if meta:
                    result = json.loads(meta)
                    print(f"Found JPEG embedded metadata: {result}")
                    return result
        except Exception as e:
            print(f"Error reading image metadata from {content_path}: {e}")
            pass
        
        
        try:
            if content_path.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
                
                result = subprocess.run(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', content_path], capture_output=True, text=True)
                if result.returncode == 0:
                    probe_data = json.loads(result.stdout)
                    format_tags = probe_data.get('format', {}).get('tags', {})
                    
                    
                    print(f"Video format tags: {format_tags}")

                    for key, value in format_tags.items():
                        if 'openelara' in key.lower() and 'metadata' in key.lower():
                            try:
                                if value.startswith('{'):
                                    result = json.loads(value)
                                    print(f"Found OpenElara JSON metadata in tag {key}")
                                    return result
                            except Exception as e:
                                print(f"Error parsing JSON metadata from tag {key}: {e}")
                                pass
                    
                    if 'description' in format_tags:
                        desc = format_tags['description']
                        if 'Metadata:' in desc and desc.endswith('}'):
                            
                            json_start = desc.find('Metadata:') + 10
                            json_part = desc[json_start:]
                            try:
                                result = json.loads(json_part)
                                print(f"Found metadata in description field")
                                return result
                            except Exception as e:
                                print(f"Error parsing metadata from description: {e}")
                                pass
                    
                    
                    openelara_tags = {k: v for k, v in format_tags.items() if 'openelara' in k.lower()}
                    if openelara_tags:
                        print(f"Found OpenElara tags: {openelara_tags}")
                        
                        metadata: Dict[str, Any] = {
                            'generator': 'OpenElara',
                            'notice': format_tags.get('comment', 'AI-generated content'),
                            'generated_at': format_tags.get('date', ''),
                            'content_signature': format_tags.get('openelara_signature', ''),
                            'model': {
                                'name': format_tags.get('openelara_model', 'unknown'),
                                'provider': format_tags.get('openelara_provider', 'unknown')
                            },
                            'provenance_id': format_tags.get('openelara_provenance', ''),
                            'installation_id': format_tags.get('openelara_installation', ''),
                            'content_type': format_tags.get('openelara_content_type', 'video')
                        }
                        return metadata
                        
                else:
                    print(f"ffprobe failed for {content_path}: {result.stderr}")
        except Exception as e:
            print(f"Error checking video metadata for {content_path}: {e}")
            pass
        
        return None

def main():
    if len(sys.argv) < 2:
        print("OpenElara Content Watermarking System")
        print(f"Usage: python content_watermark.py '<json_input>'")
        return
    
    try:
        print(f"Received input: {sys.argv[1]}")
        input_data = json.loads(sys.argv[1])
        action = input_data.get('action')
        print(f"Action: {action}")
        
        watermarker = ContentWatermark()
        
        if action == 'watermark':
            content_path = input_data['content_path']
            metadata_input = input_data['metadata']
            use_c2pa = input_data.get('use_c2pa', True)
            
            content_type = metadata_input.get('content_type', 'unknown')
            model_info = metadata_input.get('model_info', {})
            generation_params = metadata_input.get('generation_params', {})
            
            print(f"Watermarking content: {content_path}")
            print(f"Content type: {content_type}")
            print(f"Model info: {model_info}")
            print(f"Generation params: {generation_params}")
            
            result_metadata = watermarker.watermark_content(
                content_path=content_path,
                content_type=content_type,
                model_info=model_info,
                generation_params=generation_params,
                embed_in_file=True,
                use_c2pa=use_c2pa
            )
            
            print(f"Watermarking completed successfully")
            print(json.dumps({
                'success': True,
                'metadata': result_metadata
            }))
            
        elif action == 'verify':
            content_path = input_data['content_path']
            metadata = watermarker.verify_watermark(content_path)
            
            if metadata:
                print(json.dumps({
                    'success': True,
                    'verified': True,
                    'metadata': metadata
                }))
            else:
                print(json.dumps({
                    'success': True,
                    'verified': False,
                    'message': 'No watermark found'
                }))
        else:
            print(json.dumps({
                'success': False,
                'error': f'Unknown action: {action}'
            }))
            
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()