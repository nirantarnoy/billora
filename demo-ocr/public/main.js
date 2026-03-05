const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const resetBtn = document.getElementById('reset-btn');
const loading = document.getElementById('loading');
const resultForm = document.getElementById('result-form');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const saveJsonBtn = document.getElementById('save-json');
const saveTemplateBtn = document.getElementById('save-template-btn');
const templateList = document.getElementById('template-list');

let currentTemplate = null;

// Handle File Selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        dropZone.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        startScan(file);
    };
    reader.readAsDataURL(file);
}

resetBtn.addEventListener('click', () => {
    location.reload();
});

async function startScan(file) {
    loading.classList.remove('hidden');
    resultForm.classList.add('hidden');

    const formData = new FormData();
    formData.append('document', file);

    try {
        const response = await fetch('/api/scan', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
            loading.classList.add('hidden');
        } else {
            displayResults(data);
        }
    } catch (err) {
        alert('Failed to connect to server');
        console.error(err);
        loading.classList.add('hidden');
    }
}

function displayResults(data) {
    loading.classList.add('hidden');
    resultForm.classList.remove('hidden');

    document.getElementById('doc-date').value = data.date || '';
    document.getElementById('raw-output').textContent = data.rawText;

    itemsContainer.innerHTML = '';

    data.items.forEach(item => {
        createItemRow(item.name, item.amount, item.unit);
    });

    if (data.items.length === 0) {
        createItemRow('', '', '');
    }

    // Auto apply comparison if template is already selected
    if (currentTemplate) {
        applyComparison();
    }
}

function createItemRow(name = '', amount = '', unit = '') {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" placeholder="ชื่อสินค้า" value="${name}" class="item-name">
        <input type="number" placeholder="จำนวน" value="${amount}" class="item-amount">
        <input type="text" placeholder="หน่วย" value="${unit}" class="item-unit">
        <button type="button" class="btn-delete">×</button>
    `;

    row.querySelector('.btn-delete').addEventListener('click', () => row.remove());
    // Also re-apply comparison when text is edited
    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            if (currentTemplate) applyComparison();
        });
    });

    itemsContainer.appendChild(row);
}

addItemBtn.addEventListener('click', () => createItemRow());

// Function to apply/update CSS highlights based on template
function applyComparison() {
    if (!currentTemplate) return;

    const templateItems = currentTemplate.data.items || [];
    const templateNames = templateItems.map(ti => ti.name.trim().toLowerCase());

    document.querySelectorAll('.item-row').forEach(row => {
        const currentName = row.querySelector('.item-name').value.trim().toLowerCase();

        if (currentName && !templateNames.includes(currentName)) {
            row.classList.add('diff-new');
        } else {
            row.classList.remove('diff-new');
        }
    });
}

// Save Data as JSON Download
saveJsonBtn.addEventListener('click', () => {
    const data = getFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-data-${Date.now()}.json`;
    a.click();
});

// Template Management Logic
saveTemplateBtn.addEventListener('click', async () => {
    const name = prompt('กรุณาตั้งชื่อแม่แบบนี้ (เช่น ใบเบิกคลัง A):');
    if (!name) return;

    const data = getFormData();
    data.templateName = name;

    try {
        const res = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, data })
        });
        if (res.ok) {
            alert('บันทึกแม่แบบสำเร็จ!');
            loadTemplates();
        }
    } catch (err) { alert('Failed to save template'); }
});

async function loadTemplates() {
    try {
        const res = await fetch('/api/templates');
        const templates = await res.json();

        if (templates.length === 0) return;

        templateList.innerHTML = '';
        templates.forEach(t => {
            const chip = document.createElement('div');
            chip.className = 'template-chip';
            if (currentTemplate && currentTemplate.id === t.id) chip.classList.add('active');

            chip.textContent = t.name;
            chip.onclick = () => {
                const wasActive = chip.classList.contains('active');
                document.querySelectorAll('.template-chip').forEach(c => c.classList.remove('active'));

                if (wasActive) {
                    currentTemplate = null;
                } else {
                    chip.classList.add('active');
                    currentTemplate = t;
                    applyComparison();
                }
            };
            templateList.appendChild(chip);
        });
    } catch (err) { console.error('Error loading templates'); }
}

function getFormData() {
    return {
        date: document.getElementById('doc-date').value,
        items: Array.from(document.querySelectorAll('.item-row')).map(row => ({
            name: row.querySelector('.item-name').value,
            amount: row.querySelector('.item-amount').value,
            unit: row.querySelector('.item-unit').value
        }))
    };
}

loadTemplates();
