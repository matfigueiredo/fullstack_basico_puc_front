const API_URL = 'http://localhost:5000/api';

const elements = {
    listTab: document.getElementById('list-tab'),
    formTab: document.getElementById('form-tab'),
    
    clientsListSection: document.getElementById('clients-list-section'),
    clientFormSection: document.getElementById('client-form-section'),
    clientDetailsSection: document.getElementById('client-details-section'),
    
    clientsContainer: document.getElementById('clients-container'),
    searchInput: document.getElementById('search-input'),
    
    clientForm: document.getElementById('client-form'),
    formTitle: document.getElementById('form-title'),
    clientId: document.getElementById('client-id'),
    clientName: document.getElementById('client-name'),
    clientEmail: document.getElementById('client-email'),
    clientPhone: document.getElementById('client-phone'),
    attributesContainer: document.getElementById('attributes-container'),
    addAttributeBtn: document.getElementById('add-attribute-btn'),
    cancelButton: document.getElementById('cancel-button'),
    
    clientDetailsContainer: document.getElementById('client-details-container'),
    clientAttributesContainer: document.getElementById('client-attributes-container'),
    editClientBtn: document.getElementById('edit-client-btn'),
    deleteClientBtn: document.getElementById('delete-client-btn'),
    backToListBtn: document.getElementById('back-to-list-btn'),
    addAttributeForm: document.getElementById('add-attribute-form'),
    attributeKey: document.getElementById('attribute-key'),
    attributeValue: document.getElementById('attribute-value'),
    
    clientCardTemplate: document.getElementById('client-card-template'),
    attributeItemTemplate: document.getElementById('attribute-item-template'),
    attributeInputTemplate: document.getElementById('attribute-input-template')
};

let currentClient = null;
let clients = [];
let filteredClients = [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadClients();
});

function setupEventListeners() {
    elements.listTab.addEventListener('click', () => showSection(elements.clientsListSection));
    elements.formTab.addEventListener('click', () => {
        resetForm();
        showSection(elements.clientFormSection);
    });
    
    elements.searchInput.addEventListener('input', filterClients);
    
    elements.clientForm.addEventListener('submit', handleClientFormSubmit);
    elements.cancelButton.addEventListener('click', () => showSection(elements.clientsListSection));
    elements.addAttributeBtn.addEventListener('click', addAttributeInput);
    
    elements.backToListBtn.addEventListener('click', () => showSection(elements.clientsListSection));
    elements.editClientBtn.addEventListener('click', editCurrentClient);
    elements.deleteClientBtn.addEventListener('click', deleteCurrentClient);
    elements.addAttributeForm.addEventListener('submit', addAttributeToClient);
}

async function loadClients() {
    try {
        showLoading(elements.clientsContainer);
        const response = await fetch(`${API_URL}/clients`);
        if (!response.ok) throw new Error('Erro ao carregar clientes');
        
        clients = await response.json();
        filteredClients = [...clients];
        renderClientsList(clients);
    } catch (error) {
        showError(elements.clientsContainer, 'Erro ao carregar clientes');
        console.error(error);
    }
}

function renderClientsList(clientsToRender) {
    elements.clientsContainer.innerHTML = '';
    
    if (clientsToRender.length === 0) {
        elements.clientsContainer.innerHTML = '<p class="no-results">Nenhum cliente encontrado</p>';
        return;
    }

    let delay = 0;
    
    clientsToRender.forEach(client => {
        const clientCard = elements.clientCardTemplate.content.cloneNode(true);
        const cardElement = clientCard.querySelector('.client-card');
        
        cardElement.dataset.id = client.id;
        cardElement.querySelector('.client-name').textContent = client.name;
        cardElement.querySelector('.client-email').textContent = client.email;
        
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'translateY(20px)';
        cardElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        cardElement.style.transitionDelay = `${delay}ms`;
        
        const viewDetailsBtn = cardElement.querySelector('.view-details-btn');
        viewDetailsBtn.addEventListener('click', () => loadClientDetails(client.id));
        
        elements.clientsContainer.appendChild(cardElement);
        
        setTimeout(() => {
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'translateY(0)';
        }, 10);
        
        delay += 50;
    });
}

function filterClients() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredClients = [...clients];
    } else {
        filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) || 
            client.email.toLowerCase().includes(searchTerm)
        );
    }
    
    renderClientsList(filteredClients);
}

async function loadClientDetails(clientId) {
    try {
        showLoading(elements.clientDetailsContainer);
        const response = await fetch(`${API_URL}/clients/${clientId}`);
        if (!response.ok) throw new Error('Erro ao carregar detalhes do cliente');
        
        currentClient = await response.json();
        renderClientDetails();
        showSection(elements.clientDetailsSection);
    } catch (error) {
        showError(elements.clientDetailsContainer, 'Erro ao carregar detalhes do cliente');
        console.error(error);
    }
}

function renderClientDetails() {
    if (!currentClient) return;
    
    elements.clientDetailsContainer.innerHTML = `
        <div class="client-detail-item">
            <span class="client-detail-label">Nome:</span> ${currentClient.name}
        </div>
        <div class="client-detail-item">
            <span class="client-detail-label">Email:</span> ${currentClient.email}
        </div>
        <div class="client-detail-item">
            <span class="client-detail-label">Telefone:</span> ${currentClient.phone || 'Não informado'}
        </div>
        <div class="client-detail-item">
            <span class="client-detail-label">Data de Cadastro:</span> ${formatDate(currentClient.created_at)}
        </div>
    `;
    
    renderClientAttributes();
}

function renderClientAttributes() {
    elements.clientAttributesContainer.innerHTML = '';
    
    if (!currentClient.attributes || currentClient.attributes.length === 0) {
        elements.clientAttributesContainer.innerHTML = '<p class="no-attributes">Nenhum atributo cadastrado</p>';
        return;
    }
    
    currentClient.attributes.forEach(attribute => {
        const attributeItem = elements.attributeItemTemplate.content.cloneNode(true);
        const itemElement = attributeItem.querySelector('.attribute-item');
        
        itemElement.dataset.id = attribute.id;
        itemElement.querySelector('.attribute-key').textContent = attribute.key;
        itemElement.querySelector('.attribute-value').textContent = attribute.value;
        
        elements.clientAttributesContainer.appendChild(itemElement);
    });
}

async function addAttributeToClient(event) {
    event.preventDefault();
    
    if (!currentClient) return;
    
    const attributeData = {
        key: elements.attributeKey.value,
        value: elements.attributeValue.value
    };
    
    try {
        const response = await fetch(`${API_URL}/clients/${currentClient.id}/attributes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attributeData)
        });
        
        if (!response.ok) throw new Error('Erro ao adicionar atributo');
        
        const newAttribute = await response.json();
        
        if (!currentClient.attributes) currentClient.attributes = [];
        currentClient.attributes.push(newAttribute);
        
        renderClientAttributes();
        
        elements.attributeKey.value = '';
        elements.attributeValue.value = '';
        
        showNotification('Atributo adicionado com sucesso');
    } catch (error) {
        showNotification('Erro ao adicionar atributo', 'error');
        console.error(error);
    }
}

async function handleClientFormSubmit(event) {
    event.preventDefault();
    
    const isEditing = elements.clientId.value !== '';
    const clientData = {
        name: elements.clientName.value,
        email: elements.clientEmail.value,
        phone: elements.clientPhone.value,
        attributes: []
    };
    
    const attributeInputs = elements.attributesContainer.querySelectorAll('.attribute-input');
    attributeInputs.forEach(input => {
        const key = input.querySelector('.attribute-key-input').value;
        const value = input.querySelector('.attribute-value-input').value;
        
        if (key && value) {
            clientData.attributes.push({ key, value });
        }
    });
    
    try {
        let response;
        
        if (isEditing) {
            response = await fetch(`${API_URL}/clients/${elements.clientId.value}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });
        } else {
            response = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });
        }
        
        if (!response.ok) throw new Error('Erro ao salvar cliente');
        
        await loadClients();
        
        showSection(elements.clientsListSection);
        
        showNotification(`Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso`);

        resetForm();
    } catch (error) {
        showNotification('Erro ao salvar cliente', 'error');
        console.error(error);
    }
}

function editCurrentClient() {
    if (!currentClient) return;
    
    elements.clientId.value = currentClient.id;
    elements.clientName.value = currentClient.name;
    elements.clientEmail.value = currentClient.email;
    elements.clientPhone.value = currentClient.phone || '';
    
    elements.attributesContainer.innerHTML = '';

    if (currentClient.attributes && currentClient.attributes.length > 0) {
        currentClient.attributes.forEach(attribute => {
            const attributeInput = elements.attributeInputTemplate.content.cloneNode(true);
            const inputElement = attributeInput.querySelector('.attribute-input');
            
            inputElement.querySelector('.attribute-key-input').value = attribute.key;
            inputElement.querySelector('.attribute-value-input').value = attribute.value;
            
            const removeBtn = inputElement.querySelector('.remove-attribute-btn');
            removeBtn.addEventListener('click', () => inputElement.remove());
            
            elements.attributesContainer.appendChild(inputElement);
        });
    }
    
    elements.formTitle.textContent = 'Editar Cliente';
    
    showSection(elements.clientFormSection);
}

async function deleteCurrentClient() {
    if (!currentClient) return;
    
    if (!confirm(`Tem certeza que deseja excluir o cliente ${currentClient.name}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/clients/${currentClient.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir cliente');
        
        await loadClients();
        
        showSection(elements.clientsListSection);
        
        showNotification('Cliente excluído com sucesso');
        
        currentClient = null;
    } catch (error) {
        showNotification('Erro ao excluir cliente', 'error');
        console.error(error);
    }
}

function addAttributeInput() {
    const attributeInput = elements.attributeInputTemplate.content.cloneNode(true);
    const inputElement = attributeInput.querySelector('.attribute-input');
    
    const removeBtn = inputElement.querySelector('.remove-attribute-btn');
    removeBtn.addEventListener('click', () => inputElement.remove());
    
    elements.attributesContainer.appendChild(inputElement);
}

function resetForm() {
    elements.clientForm.reset();
    elements.clientId.value = '';
    elements.attributesContainer.innerHTML = '';
    elements.formTitle.textContent = 'Cadastrar Novo Cliente';
}

function showSection(section) {
    [elements.clientsListSection, elements.clientFormSection, elements.clientDetailsSection].forEach(s => {
        if (s.classList.contains('active') && s !== section) {
            s.style.opacity = '0';
            s.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                s.classList.remove('active');
                s.style.opacity = '';
                s.style.transform = '';
            }, 300);
        }
    });
    
    [elements.listTab, elements.formTab].forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (!section.classList.contains('active')) {
        setTimeout(() => {
            section.classList.add('active');
            
            setTimeout(() => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 10);
        }, 300);
        
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
    } else {
        section.classList.add('active');
    }
    
    if (section === elements.clientsListSection) {
        elements.listTab.classList.add('active');
    } else if (section === elements.clientFormSection) {
        elements.formTab.classList.add('active');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(element) {
    element.innerHTML = '<div class="loading">Carregando...</div>';
}

function showError(element, message) {
    element.innerHTML = `<div class="error">${message}</div>`;
}

function showNotification(message, type = 'success') {
    document.querySelectorAll('.notification').forEach(notif => {
        notif.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            ${icon}
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 10);
}
