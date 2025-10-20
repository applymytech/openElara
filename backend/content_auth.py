import os
import hashlib
import json
import uuid
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Optional, TypedDict

class CertificateContent(TypedDict):
    file_name: str
    file_size_bytes: int
    content_type: str
    mime_type: str

class CertificateHashes(TypedDict):
    sha256: str
    sha512: str
    md5: str
    algorithm: str

class CertificateGenerator(TypedDict):
    software: str
    version: str
    installation_id: str
    type: str

class CertificateAIModel(TypedDict):
    name: str
    provider: str
    type: str
    custom_model_id: Any

class CertificateGenerationSettings(TypedDict, total=False):
    steps: Any
    guidance_scale: Any
    width: Any
    height: Any
    seed: Any
    negative_prompt: Any

class CertificateGeneration(TypedDict):
    prompt_hash: str
    prompt_length: int
    mode: str
    settings: CertificateGenerationSettings
    negative_prompt_hash: Any

class CertificateProvenance(TypedDict):
    parent_id: Any
    derived_from: Any
    modification_history: list[Any]

class CertificateLegal(TypedDict):
    notice: str
    disclaimer: str
    copyright: str
    ai_disclosure: str

class CertificatePrivacy(TypedDict):
    data_collection: str
    personal_data: str
    installation_id_purpose: str
    prompt_storage: str

class CertificateDict(TypedDict):
    certificate_version: str
    certificate_id: str
    provenance_id: str
    generated_at: str
    generated_at_unix: int
    content: CertificateContent
    content_hashes: CertificateHashes
    generator: CertificateGenerator
    ai_model: CertificateAIModel
    generation: CertificateGeneration
    provenance: CertificateProvenance
    legal: CertificateLegal
    privacy: CertificatePrivacy
    certificate_signature: str


class ContentAuthenticator:
    def compute_content_hash(self, file_path: str) -> CertificateHashes:
        sha256_hash = hashlib.sha256()
        sha512_hash = hashlib.sha512()
        md5_hash = hashlib.md5()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
                sha512_hash.update(chunk)
                md5_hash.update(chunk)
        return {
            'sha256': sha256_hash.hexdigest(),
            'sha512': sha512_hash.hexdigest(),
            'md5': md5_hash.hexdigest(),
            'algorithm': 'SHA-256, SHA-512, MD5'
        }

    def _sign_certificate(self, certificate: CertificateDict) -> str:
        cert_copy = certificate.copy()
        cert_copy['certificate_signature'] = ''
        cert_string = json.dumps(cert_copy, sort_keys=True)
        signature_input = f"{cert_string}:{self.installation_id}"
        signature = hashlib.sha512(signature_input.encode()).hexdigest()
        return signature

    def __init__(self, app_version: str = "1.0.0"):
        self.app_version = app_version
        self.config_path = os.path.join(
            os.path.expanduser('~'), '.openelara', 'auth_config.json'
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
            'created_at': datetime.now(timezone.utc).isoformat(),
            'version': self.app_version,
            'purpose': 'Content authentication - local only, never transmitted'
        }
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
        return installation_id

    def generate_certificate(
        self,
        content_path: str,
        content_type: str,
        model_info: Dict[str, Any],
        generation_params: Dict[str, Any]
    ) -> CertificateDict:
        timestamp = datetime.now(timezone.utc)
        content_hashes = self.compute_content_hash(content_path)
        file_stats = os.stat(content_path)
        file_size = file_stats.st_size
        provenance_id = str(uuid.uuid4())
        prompt: str = generation_params.get('prompt', '')
        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
        certificate: CertificateDict = {
            'certificate_version': '1.0',
            'certificate_id': str(uuid.uuid4()),
            'provenance_id': provenance_id,
            'generated_at': timestamp.isoformat(),
            'generated_at_unix': int(timestamp.timestamp()),
            'content': {
                'file_name': os.path.basename(content_path),
                'file_size_bytes': file_size,
                'content_type': content_type,
                'mime_type': self._get_mime_type(content_path)
            },
            'content_hashes': content_hashes,
            'generator': {
                'software': 'OpenElara',
                'version': self.app_version,
                'installation_id': self.installation_id,
                'type': 'ai_content_generator'
            },
            'ai_model': {
                'name': model_info.get('name', 'unknown'),
                'provider': model_info.get('provider', 'unknown'),
                'type': model_info.get('type', 'generative_ai'),
                'custom_model_id': model_info.get('customModelId')
            },
            'generation': {
                'prompt_hash': prompt_hash,
                'prompt_length': len(prompt),
                'mode': generation_params.get('mode', 'T2I'),
                'settings': {
                    'steps': generation_params.get('settings', {}).get('steps'),
                    'guidance_scale': generation_params.get('settings', {}).get('guidance_scale'),
                    'width': generation_params.get('settings', {}).get('width'),
                    'height': generation_params.get('settings', {}).get('height'),
                    'seed': generation_params.get('settings', {}).get('seed')
                },
                'negative_prompt_hash': (
                    hashlib.sha256(
                        str(generation_params.get('settings', {}).get('negative_prompt', '')).encode()
                    ).hexdigest() if generation_params.get('settings', {}).get('negative_prompt') else None
                )
            },
            'provenance': {
                'parent_id': generation_params.get('parent_id'),
                'derived_from': generation_params.get('derived_from'),
                'modification_history': []
            },
            'legal': {
                'notice': 'AI-generated content. Created with OpenElara.',
                'disclaimer': 'This content was created with AI assistance. Verify information independently.',
                'copyright': 'Content generated by user using OpenElara software.',
                'ai_disclosure': 'This is AI-generated content and must be disclosed as such when shared publicly.'
            },
            'privacy': {
                'data_collection': 'none',
                'personal_data': 'none',
                'installation_id_purpose': 'Local authentication only, never transmitted',
                'prompt_storage': 'Hashed only, plaintext not stored in certificate'
            },
            'certificate_signature': ''
        }
        certificate['certificate_signature'] = self._sign_certificate(certificate)
        return certificate
    
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
    
    def save_certificate(self, content_path: str, certificate: CertificateDict) -> str:
        cert_path = content_path + '.certificate.json'
        
        with open(cert_path, 'w', encoding='utf-8') as f:
            json.dump(certificate, f, indent=2, sort_keys=True)
        
        return cert_path
    
    def verify_content(self, content_path: str, certificate_path: Optional[str] = None) -> Dict[str, Any]:
        result: dict[str, Any] = {
            'valid': False,
            'hash_match': False,
            'certificate_valid': False,
            'tampered': False,
            'errors': [],
            'warnings': []
        }
        # Find certificate
        if not certificate_path:
            certificate_path = content_path + '.certificate.json'
        if not os.path.exists(certificate_path):
            result['errors'].append('Certificate file not found')
            return result
        # Load certificate
        try:
            with open(certificate_path, 'r', encoding='utf-8') as f:
                certificate = json.load(f)
        except Exception as e:
            result['errors'].append(f'Failed to load certificate: {e}')
            return result
        # 1. Verify certificate signature
        claimed_signature = certificate.get('certificate_signature')
        calculated_signature = self._sign_certificate(certificate)
        if claimed_signature != calculated_signature:
            result['errors'].append('Certificate signature invalid - certificate may be tampered')
            result['certificate_valid'] = False
        else:
            result['certificate_valid'] = True
        # 2. Verify content hashes
        try:
            current_hashes = self.compute_content_hash(content_path)
        except FileNotFoundError:
            result['errors'].append('Content file not found')
            return result
        
        certificate_hashes = certificate.get('content_hashes', {})
        if current_hashes['sha256'] != certificate_hashes.get('sha256'):
            result['errors'].append('SHA-256 hash mismatch - content has been modified')
            result['tampered'] = True
        elif current_hashes['sha512'] != certificate_hashes.get('sha512'):
            result['errors'].append('SHA-512 hash mismatch - content has been modified')
            result['tampered'] = True
        elif current_hashes['md5'] != certificate_hashes.get('md5'):
            result['warnings'].append('MD5 hash mismatch - possible modification')
        else:
            result['hash_match'] = True
        # 3. Verify file size
        current_size = os.stat(content_path).st_size
        certificate_size = certificate.get('content', {}).get('file_size_bytes')
        if current_size != certificate_size:
            result['warnings'].append(f'File size changed: {certificate_size} -> {current_size} bytes')
        # 4. Overall validity
        result['valid'] = (result['certificate_valid'] and 
                            result['hash_match'] and 
                            not result['tampered'])
        return result
    
    def generate_human_readable_certificate(self, certificate: CertificateDict) -> str:
        lines: list[str] = []
        lines.append("=" * 80)
        lines.append("CONTENT AUTHENTICATION CERTIFICATE")
        lines.append("=" * 80)
        lines.append("")
        lines.append(f"Certificate ID: {certificate['certificate_id']}")
        lines.append(f"Generated: {certificate['generated_at']}")
        lines.append("")
        lines.append("--- CONTENT INFORMATION ---")
        lines.append(f"File: {certificate['content']['file_name']}")
        lines.append(f"Type: {certificate['content']['content_type']}")
        lines.append(f"Size: {certificate['content']['file_size_bytes']:,} bytes")
        lines.append("")
        lines.append("--- CRYPTOGRAPHIC HASHES (Tamper Detection) ---")
        lines.append(f"SHA-256: {certificate['content_hashes']['sha256']}")
        lines.append(f"SHA-512: {certificate['content_hashes']['sha512'][:64]}...")
        lines.append(f"MD5:     {certificate['content_hashes']['md5']}")
        lines.append("")
        lines.append("--- AI GENERATION DETAILS ---")
        lines.append(f"Generator: {certificate['generator']['software']} v{certificate['generator']['version']}")
        lines.append(f"AI Model: {certificate['ai_model']['name']}")
        lines.append(f"Provider: {certificate['ai_model']['provider']}")
        lines.append(f"Mode: {certificate['generation']['mode']}")
        lines.append("")
        lines.append("--- GENERATION SETTINGS ---")
        for key, value in certificate['generation']['settings'].items():
            if value is not None:
                lines.append(f"  {key}: {value}")
        lines.append("")
        lines.append("--- VERIFICATION ---")
        lines.append(f"Prompt Hash: {certificate['generation']['prompt_hash'][:32]}...")
        lines.append(f"Certificate Signature: {certificate['certificate_signature'][:32]}...")
        lines.append("")
        lines.append("--- LEGAL NOTICE ---")
        lines.append(certificate['legal']['notice'])
        lines.append(certificate['legal']['ai_disclosure'])
        lines.append("")
        lines.append("=" * 80)
        lines.append("To verify this content:")
        lines.append("1. Check that the file size and hashes match this certificate")
        lines.append("2. Any modification to the image will change the SHA-256 hash")
        lines.append("3. Compare the certificate signature to detect tampering")
        lines.append("=" * 80)
        return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("OpenElara Content Authentication System")
        print("Usage:")
        print("  Generate: python content_auth.py generate <file> <model_info_json> <params_json>")
        print("  Verify:   python content_auth.py verify <file> [certificate_file]")
        print("  View:     python content_auth.py view <certificate_file>")
        return
    
    action = sys.argv[1]
    authenticator = ContentAuthenticator()
    
    if action == 'generate' and len(sys.argv) >= 5:
        file_path = sys.argv[2]
        try:
            model_info = json.loads(sys.argv[3])
            generation_params = json.loads(sys.argv[4])
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON input: {e}")
            return
        
        # Determine content type
        ext = os.path.splitext(file_path)[1].lower()
        content_type = 'image' if ext in ['.png', '.jpg', '.jpeg', '.webp'] else 'video'
        
        try:
            # Generate certificate
            certificate = authenticator.generate_certificate(
                file_path, content_type, model_info, generation_params
            )
        except FileNotFoundError:
            print(f"Error: Content file not found at {file_path}")
            return
        
        # Save certificate
        cert_path = authenticator.save_certificate(file_path, certificate)
        
        # Save human-readable version
        readable_path = file_path + '.certificate.txt'
        try:
            with open(readable_path, 'w', encoding='utf-8') as f:
                f.write(authenticator.generate_human_readable_certificate(certificate))
        except IOError as e:
            print(f"Error saving human-readable certificate: {e}")
            
        print(json.dumps({
            'success': True,
            'certificate_path': cert_path,
            'readable_path': readable_path,
            'certificate_id': certificate['certificate_id']
        }))
    
    elif action == 'verify' and len(sys.argv) >= 3:
        file_path = sys.argv[2]
        cert_path = sys.argv[3] if len(sys.argv) > 3 else None
        
        result = authenticator.verify_content(file_path, cert_path)
        print(json.dumps(result, indent=2))
    
    elif action == 'view' and len(sys.argv) >= 3:
        cert_path = sys.argv[2]
        try:
            with open(cert_path, 'r', encoding='utf-8') as f:
                certificate = json.load(f)
            print(authenticator.generate_human_readable_certificate(certificate))
        except FileNotFoundError:
            print(f"Error: Certificate file not found at {cert_path}")
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON certificate: {e}")
    
    else:
        print("Invalid command. Use the usage information above for correct syntax.")


if __name__ == '__main__':
    main()