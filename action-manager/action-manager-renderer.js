// action-manager-renderer.js
// Externalized to comply with CSP (script-src 'self')

let actions = [];
let editingActionOriginalName = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadActions();
  setupEventListeners();
  renderActions();
});

function setupEventListeners() {
  document.getElementById('add-action-btn').addEventListener('click', openAddModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-save-btn').addEventListener('click', saveAction);
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeModal();
  });
  const styleSelect = document.getElementById('action-style');
  if (styleSelect) {
    styleSelect.addEventListener('change', (e) => {
      const customGroup = document.getElementById('custom-style-group');
      if (customGroup) customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
  }
}

async function loadActions() {
  try {
    // Prefer app's CRUD IPC so Manager and Quick Insert see the same data
    const storedActions = await window.electronAPI.getActions();
    actions = Array.isArray(storedActions) ? storedActions : (storedActions || []);
  } catch (error) {
    console.error('Error loading actions:', error);
    actions = [];
  }
}

function renderActions() {
  const grid = document.getElementById('actions-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid || !emptyState) return;

  if (!actions.length) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  grid.innerHTML = actions
    .map((action) => {
      const preview = (action.content || '').toString();
      return `
        <div class="action-card" data-action-name="${action.name}">
          <div class="action-card-header">
            <span class="action-card-title">${escapeHtml(action.name || '')}</span>
            <div class="action-card-actions">
              <button class="action-card-btn btn-edit" data-action-name="${action.name}" title="Edit">✏️</button>
              <button class="action-card-btn btn-delete" data-action-name="${action.name}" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="action-preview">
            ${escapeHtml(preview).substring(0, 100)}${preview.length > 100 ? '...' : ''}
          </div>
        </div>`;
    })
    .join('');

  attachCardListeners();
}

function attachCardListeners() {
  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(e.currentTarget.dataset.actionName);
    });
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Delete this action?')) {
        await deleteAction(e.currentTarget.dataset.actionName);
      }
    });
  });
}

function openAddModal() {
  editingActionOriginalName = null;
  document.getElementById('modal-title').textContent = 'Add New Action';
  document.getElementById('action-name').value = '';
  document.getElementById('action-text').value = '';
  document.getElementById('action-style').value = 'default';
  document.getElementById('custom-style-input').value = '';
  document.getElementById('custom-style-group').style.display = 'none';
  document.getElementById('edit-modal').classList.add('active');
}

function openEditModal(actionName) {
  const action = actions.find((a) => a.name === actionName);
  if (!action) return;

  editingActionOriginalName = action.name;
  document.getElementById('modal-title').textContent = 'Edit Action';
  document.getElementById('action-name').value = action.name || '';
  document.getElementById('action-text').value = action.content || '';
  document.getElementById('action-style').value = action.style || 'default';
  document.getElementById('custom-style-input').value = action.customStyle || '';
  document.getElementById('custom-style-group').style.display = action.style === 'custom' ? 'block' : 'none';
  document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('active');
  editingActionId = null;
}

async function saveAction() {
  const name = document.getElementById('action-name').value.trim();
  const text = document.getElementById('action-text').value.trim();
  const style = document.getElementById('action-style').value;
  const customStyle = document.getElementById('custom-style-input').value.trim();

  if (!name || !text) {
    alert('Please fill in all required fields');
    return;
  }

  const actionData = {
    name,
    content: text,
    style,
    customStyle: style === 'custom' ? customStyle : null,
  };

  try {
    // Handle rename: if editing existing and name changed, remove old first
    if (editingActionOriginalName && editingActionOriginalName !== name) {
      await window.electronAPI.removeAction(editingActionOriginalName);
    }
    const result = await window.electronAPI.saveAction(actionData);
    if (!result?.success) throw new Error(result?.error || 'Unknown error');
    await loadActions();
    renderActions();
    closeModal();
  } catch (error) {
    alert(`Error saving action: ${error.message}`);
  }
}

async function deleteAction(actionName) {
  try {
    if (actionName) await window.electronAPI.removeAction(actionName);
    await loadActions();
    renderActions();
  } catch (error) {
    alert(`Error deleting action: ${error.message}`);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
