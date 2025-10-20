const { ipcMain } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { runPythonScript } = require('../utils');

let addC2pa;
try {
    addC2pa = require('c2pa-node').addC2pa;
} catch (e) {
    log.warn('c2pa-node not available, falling back to legacy watermarking');
}

class SignerManager {
    constructor() {
        this.privateKey = null;
        this.publicKey = null;
        this.initializeKeys();
    }

    initializeKeys() {
        try {
            const envPath = path.join(process.cwd(), 'signing-keys.env');

            if (!fs.existsSync(envPath)) {
                throw new Error('signing-keys.env file not found. Please create this file with your signing keys.');
            }

            const envContent = fs.readFileSync(envPath, 'utf8');
            // Extract the private key between matching quotes. Support multi-line PEMs.
            const match = envContent.match(/SIGNING_PRIVATE_KEY\s*=\s*(["'])([\s\S]*?)\1/);
            if (!match) {
                throw new Error('SIGNING_PRIVATE_KEY not found or not wrapped in quotes in signing-keys.env. Use the template to add your PEM.');
            }

            let privateKeyPem = match[2] || '';
            // Normalize Windows CRLF to LF to avoid OpenSSL PEM parsing issues
            privateKeyPem = privateKeyPem.replace(/\r\n/g, '\n').trim();

            if (!privateKeyPem || privateKeyPem.includes('[REPLACE WITH YOUR ACTUAL')) {
                throw new Error('SIGNING_PRIVATE_KEY not properly configured in signing-keys.env. Please replace the placeholder with your actual ECDSA private key.');
            }

            // Let Node infer key type (PKCS#1 vs PKCS#8). Passing only format:'pem' is more permissive.
            this.privateKey = crypto.createPrivateKey({
                key: privateKeyPem,
                format: 'pem'
            });

            this.publicKey = crypto.createPublicKey(this.privateKey).export({
                type: 'spki',
                format: 'pem'
            });

            log.info('Signing keys loaded successfully from signing-keys.env');

        } catch (error) {
            log.error(`Failed to load signing keys: ${error.message}`);
            log.warn('Falling back to dynamic key generation. This is not secure for production use.');

            const { app } = require('electron');
            const uuid = 'openelara-' + app.getVersion();
            const seed = crypto.createHash('sha256').update(uuid).digest();

            const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
                namedCurve: 'prime256v1',
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });

            this.privateKey = privateKey;
            this.publicKey = publicKey;
        }
    }

    async embedC2PACredentials(filePath, certificate, originalName, newName) {
        if (!addC2pa) {
            return false;
        }

        try {
            const outputPath = filePath + '.c2pa_signed';

            const manifest = {
                claimGenerator: `OpenElara/${certificate.uuid}`,
                assertions: [
                    {
                        label: 'c2pa.actions',
                        data: {
                            actions: [
                                {
                                    action: 'c2pa.created',
                                    when: certificate.signedAt,
                                    softwareAgent: {
                                        name: 'OpenElara',
                                        version: certificate.uuid
                                    },
                                    parameters: {
                                        original_filename: originalName,
                                        signed_filename: newName
                                    }
                                },
                                {
                                    action: 'c2pa.signed',
                                    when: certificate.signedAt,
                                    softwareAgent: {
                                        name: 'OpenElara Digital Signer',
                                        version: certificate.version
                                    },
                                    parameters: {
                                        algorithm: certificate.algorithm,
                                        certificate_path: path.basename(certificate.certificatePath || '')
                                    }
                                }
                            ]
                        }
                    },
                    {
                        label: 'stds.schema-org.CreativeWork',
                        data: {
                            '@context': 'https://schema.org',
                            '@type': 'CreativeWork',
                            'name': newName,
                            'author': {
                                '@type': 'Organization',
                                'name': 'OpenElara'
                            },
                            'dateCreated': certificate.signedAt,
                            'copyrightNotice': 'Digitally signed with OpenElara'
                        }
                    }
                ]
            };

            await addC2pa(filePath, outputPath, {
                manifest: manifest,
                signer: {
                    type: 'pem',
                    privateKey: this.privateKey,
                    certificate: this.publicKey 
                }
            });

            fs.renameSync(outputPath, filePath);
            return true;

        } catch (error) {
            log.warn(`C2PA embedding failed: ${error.message}`);
            return false;
        }
    }

    async signFile(filePath, newName, originalName) {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            const sign = crypto.createSign('SHA256');
            sign.update(hash);
            const signature = sign.sign(this.privateKey, 'hex');

            const certificate = {
                version: '1.0',
                generator: 'OpenElara',
                signedAt: new Date().toISOString(),
                originalFilename: originalName,
                signedFilename: newName,
                fileHash: hash,
                signature: signature,
                publicKey: this.publicKey,
                algorithm: 'ECDSA-SHA256',
                uuid: require('electron').app.getVersion()
            };

            const tempCertPath = path.join(path.dirname(filePath), `${path.parse(newName).name}_certificate.json`);

            fs.writeFileSync(tempCertPath, JSON.stringify(certificate, null, 2));

            let c2paSuccess = false;
            if (addC2pa) {
                try {
                    c2paSuccess = await this.embedC2PACredentials(filePath, certificate, originalName, newName);
                    if (c2paSuccess) {
                        log.info(`C2PA credentials embedded successfully for ${filePath}`);
                    }
                } catch (c2paError) {
                    log.warn(`C2PA signing failed, falling back to legacy watermarking: ${c2paError.message}`);
                }
            }

            if (!c2paSuccess) {
                const watermarkMetadata = {
                    content_type: filePath.match(/\.(png|jpg|jpeg|gif)$/i) ? 'image' : 'video',
                    model_info: {
                        name: 'Digital Signature',
                        provider: 'OpenElara',
                        type: 'signing_system'
                    },
                    generation_params: {
                        action: 'sign',
                        originalFilename: originalName,
                        signedAt: certificate.signedAt,
                        certificatePath: tempCertPath
                    },
                    digitalSignature: {
                        hash: hash,
                        signature: signature,
                        certificatePath: tempCertPath,
                        signedAt: certificate.signedAt
                    }
                };

                const watermarkResult = await runPythonScript({
                    scriptName: 'content_watermark.py',
                    args: [JSON.stringify({
                        action: 'watermark',
                        content_path: filePath,
                        metadata: watermarkMetadata,
                        use_c2pa: false
                    })]
                });

                if (!watermarkResult || !watermarkResult.success) {
                    log.warn(`Watermarking failed for ${filePath}: ${watermarkResult?.error || 'Unknown error'}`);
                } else {
                    log.info(`Legacy watermarking successful for ${filePath}`);
                }
            }
            const watermarkMetadata = {
                content_type: filePath.match(/\.(png|jpg|jpeg|gif)$/i) ? 'image' : 'video',
                model_info: {
                    name: 'Digital Signature',
                    provider: 'OpenElara',
                    type: 'signing_system'
                },
                generation_params: {
                    action: 'sign',
                    originalFilename: originalName,
                    signedAt: certificate.signedAt,
                    certificatePath: tempCertPath
                },
                digitalSignature: {
                    hash: hash,
                    signature: signature,
                    certificatePath: tempCertPath,
                    signedAt: certificate.signedAt
                }
            };

            const watermarkResult = await runPythonScript({
                scriptName: 'content_watermark.py',
                args: [JSON.stringify({
                    action: 'watermark',
                    content_path: filePath,
                    metadata: watermarkMetadata,
                    use_c2pa: false
                })]
            });

            if (!watermarkResult || !watermarkResult.success) {
                log.warn(`Watermarking failed for ${filePath}: ${watermarkResult?.error || 'Unknown error'}`);

            } else {
                log.info(`Watermarking successful for ${filePath}`);
            }

            if (newName !== originalName) {
                const newPath = path.join(path.dirname(filePath), newName);
                fs.renameSync(filePath, newPath);
                filePath = newPath;
            }

            log.info(`File signed: ${filePath}, certificate: ${tempCertPath}, C2PA: ${c2paSuccess}`);
            return { success: true, certificatePath: tempCertPath, signedPath: filePath, c2paSigned: c2paSuccess };

        } catch (error) {
            log.error(`Signing failed for ${filePath}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async verifySignature(filePath) {
        try {
            const verifyResult = await runPythonScript({
                scriptName: 'content_watermark.py',
                args: [JSON.stringify({
                    action: 'verify',
                    content_path: filePath
                })]
            });

            if (!verifyResult || !verifyResult.verified || !verifyResult.metadata) {
                return { verified: false, message: 'No digital signature found in file' };
            }

            const metadata = verifyResult.metadata;

            if (!metadata.digitalSignature) {
                return { verified: false, message: 'File has watermark but no digital signature' };
            }

            const { hash, signature, certificatePath } = metadata.digitalSignature;

            const fileBuffer = fs.readFileSync(filePath);
            const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            if (currentHash !== hash) {
                return { verified: false, message: 'File has been modified since signing' };
            }

            const verify = crypto.createVerify('SHA256');
            verify.update(hash);
            const isValid = verify.verify(this.publicKey, signature, 'hex');

            if (!isValid) {
                return { verified: false, message: 'Signature verification failed' };
            }

            if (fs.existsSync(certificatePath)) {
                const cert = JSON.parse(fs.readFileSync(certificatePath, 'utf8'));
                return {
                    verified: true,
                    certificate: cert,
                    message: 'Signature verified successfully'
                };
            } else {
                return { verified: true, message: 'Signature valid but certificate file missing' };
            }

        } catch (error) {
            log.error(`Verification failed: ${error.message}`);
            return { verified: false, error: error.message };
        }
    }
}

const signerManager = new SignerManager();

function setupSignerHandlers() {
    ipcMain.handle('sign-files', async (event, filesToSign) => {
        const results = [];
        let successCount = 0;

        for (const item of filesToSign) {
            const tempPath = path.join(require('electron').app.getPath('temp'), `sign_${Date.now()}_${item.name}`);
            fs.writeFileSync(tempPath, Buffer.from(item.data));

            const result = await signerManager.signFile(tempPath, item.newName, item.name);
            if (result.success) {
                successCount++;
                const outputDir = path.join(require('electron').app.getPath('userData'), 'Output', 'signed');
                if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

                const finalPath = path.join(outputDir, item.newName);
                fs.renameSync(result.signedPath, finalPath);

                const finalCertPath = path.join(outputDir, path.basename(result.certificatePath));
                fs.renameSync(result.certificatePath, finalCertPath);

                result.finalPath = finalPath;
                result.finalCertPath = finalCertPath;
            }
            results.push(result);
        }

        return { success: successCount > 0, signedCount: successCount, results };
    });

    ipcMain.handle('verify-signature', async (event, { filePath }) => {
        return await signerManager.verifySignature(filePath);
    });

    log.info('Signer handlers initialized');
}

module.exports = {
    setupSignerHandlers,
    signerManager
};