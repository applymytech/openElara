const { app } = require('electron');
const path = require('path');
const log = require('electron-log');
const fsSync = require('fs');
const { spawn } = require('child_process');

function runPythonScript({ scriptName, args = [], inputData = null, event = null, progressChannel = null }) {
    return new Promise((resolve, reject) => {
        const backendPath = app.isPackaged ? path.join(process.resourcesPath, 'backend') : path.join(__dirname, '../../backend');
        const scriptPath = path.join(backendPath, scriptName);
        
        const needsUserDataPath = ['rag_backend.py', 'ingest.py', 'ingestion_orchestrator.py'].includes(scriptName);
        const writablePath = app.getPath('userData');
        
        if (needsUserDataPath && !args.includes(writablePath)) {
            args.push(writablePath);
        }
        
        log.info(`Spawning Python script: ${scriptPath} with args: ${args.join(' ')}`);

        if (!fsSync.existsSync(scriptPath)) {
            const errorMsg = `Script not found: ${scriptPath}`;
            log.error(errorMsg);
            if (event && progressChannel) event.sender.send(progressChannel, { error: errorMsg });
            return reject(new Error(errorMsg));
        }

        const pythonProcess = spawn('python', [scriptPath, ...args]);
        let stdout = '';
        let stderr = '';

        if (event && progressChannel) {
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                event.sender.send(progressChannel, output);
            });
        } else {
            pythonProcess.stdout.on('data', (data) => stdout += data.toString());
        }
        
        pythonProcess.stderr.on('data', (data) => {
            const errorOutput = data.toString();
            stderr += errorOutput;
            log.error(`[${scriptName} stderr]: ${errorOutput}`);
            if (event && progressChannel) event.sender.send(progressChannel, { error: errorOutput });
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                const fullError = (stdout + "\n" + stderr).trim();
                log.error(`[${scriptName}] exited with code ${code}. Full Error: ${fullError}`);
                reject(new Error(fullError || `Process exited with code ${code}`));
            } else {
                try {
                    resolve(JSON.parse(stdout));
                } catch (e) {
                    resolve(stdout);
                }
            }
        });
        
        pythonProcess.on('error', (err) => {
            log.error(`Failed to start script ${scriptName}:`, err);
            reject(err);
        });

        if (inputData) {
            pythonProcess.stdin.write(inputData);
            pythonProcess.stdin.end();
        }
    });
}

module.exports = { runPythonScript };