// C:/myCodeProjects/openElara/signer/signer.js

document.addEventListener('DOMContentLoaded', () => {
    if (!window.electronAPI) {
        console.error("FATAL: The 'electronAPI' object is not available.");
        return;
    }

    const elements = {
        fileInput: document.getElementById('fileInput'),
        selectedFilesSection: document.getElementById('selectedFilesSection'),
        selectedFilesList: document.getElementById('selectedFilesList'),
        signFilesBtn: document.getElementById('signFilesBtn'),
        statusContainer: document.getElementById('statusContainer'),
        openSignedFolderBtn: document.getElementById('openSignedFolderBtn'),
        clearSignedFolderBtn: document.getElementById('clearSignedFolderBtn')
    };

    let selectedFiles = [];

    function showStatus(message, type = 'info') {
        elements.statusContainer.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    }

    function clearStatus() {
        elements.statusContainer.innerHTML = '';
    }

    function displaySelectedFiles() {
        elements.selectedFilesList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const preview = file.type.startsWith('image/') ?
                `<img src="${URL.createObjectURL(file)}" class="file-preview" alt="Preview">` :
                `<video class="file-preview" controls><source src="${URL.createObjectURL(file)}" type="${file.type}"></video>`;

            fileItem.innerHTML = `
                ${preview}
                <div class="file-details">
                    <strong>${file.name}</strong>
                    <input type="text" placeholder="New filename (optional)" value="${file.name}" data-index="${index}">
                </div>
                <span class="remove-file" data-index="${index}" title="Remove">&times;</span>
            `;

            elements.selectedFilesList.appendChild(fileItem);
        });

        elements.selectedFilesSection.style.display = selectedFiles.length > 0 ? 'block' : 'none';
    }

    elements.fileInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files);
        selectedFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
        displaySelectedFiles();
        clearStatus();
    });

    elements.selectedFilesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-file')) {
            const index = parseInt(event.target.dataset.index);
            selectedFiles.splice(index, 1);
            displaySelectedFiles();
        }
    });

    elements.signFilesBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) {
            showStatus('Please select at least one file to sign.', 'error');
            return;
        }

        showStatus('Reading files... Please wait.', 'info');
        elements.signFilesBtn.disabled = true;

        try {
            const filesToSign = [];
            for (let index = 0; index < selectedFiles.length; index++) {
                const file = selectedFiles[index];
                const input = elements.selectedFilesList.querySelector(`input[data-index="${index}"]`);
                const newName = input ? input.value.trim() : file.name;

                const arrayBuffer = await file.arrayBuffer();

                filesToSign.push({
                    name: file.name,
                    type: file.type,
                    data: arrayBuffer,
                    newName: newName
                });
            }

            showStatus('Signing files... Please wait.', 'info');

            const result = await window.electronAPI.signFiles(filesToSign);
            if (result.success) {
                showStatus(`Successfully signed ${result.signedCount} files. Certificates created.`, 'success');
                selectedFiles = [];
                displaySelectedFiles();
                elements.fileInput.value = '';
            } else {
                showStatus(`Signing failed: ${result.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            elements.signFilesBtn.disabled = false;
        }
    });

    if (elements.openSignedFolderBtn) {
        elements.openSignedFolderBtn.addEventListener('click', async () => {
            try {
                await window.electronAPI.openSignedOutputFolder();
            } catch (error) {
                showStatus(`Error opening signed folder: ${error.message}`, 'error');
            }
        });
    }

    if (elements.clearSignedFolderBtn) {
        elements.clearSignedFolderBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete ALL files from the Signed folder? This cannot be undone.')) {
                try {
                    const result = await window.electronAPI.clearSignedOutputFolder();
                    if (result.success) {
                        showStatus(result.message, 'success');
                    } else {
                        showStatus(`Error clearing signed folder: ${result.error}`, 'error');
                    }
                } catch (error) {
                    showStatus(`Error clearing signed folder: ${error.message}`, 'error');
                }
            }
        });
    }
});