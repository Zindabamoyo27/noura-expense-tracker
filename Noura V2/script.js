// State Management
let currentUser = null;
let expenses = [];
let monthlyBudget = 0;

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const filterCategory = document.getElementById('filterCategory');
const filterPeriod = document.getElementById('filterPeriod');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const authMessage = document.getElementById('authMessage');
const setBudgetBtn = document.getElementById('setBudgetBtn');
const monthlyBudgetInput = document.getElementById('monthlyBudget');
const budgetStatus = document.getElementById('budgetStatus');
const exportBtn = document.getElementById('exportBtn');

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Toggle between login and signup
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authMessage.style.display = 'none';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    authMessage.style.display = 'none';
});

// Show message helper
function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.style.display = 'block';
    authMessage.className = 'auth-message ' + (isError ? 'error' : 'success');
}

// Signup Handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', true);
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', true);
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', true);
        return;
    }

    const existingUser = localStorage.getItem(`noura_user_${username}`);
    if (existingUser) {
        showMessage('Username already exists. Please choose another one.', true);
        return;
    }

    const user = {
        username: username,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };

    try {
        localStorage.setItem(`noura_user_${username}`, JSON.stringify(user));
        showMessage('Account created successfully! Please sign in.', false);
        
        setTimeout(() => {
            signupForm.reset();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            authMessage.style.display = 'none';
        }, 2000);
    } catch (error) {
        showMessage('Error creating account. Please try again.', true);
        console.error('Signup error:', error);
    }
});

// Login Handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showMessage('Please enter both username and password', true);
        return;
    }

    const userData = localStorage.getItem(`noura_user_${username}`);
    
    if (!userData) {
        showMessage('Invalid username or password', true);
        return;
    }

    const user = JSON.parse(userData);

    if (user.password !== password) {
        showMessage('Invalid username or password', true);
        return;
    }

    currentUser = username;
    userName.textContent = username;
    userAvatar.textContent = username.charAt(0).toUpperCase();
    
    loadExpenses();
    loadBudget();
    
    loginPage.style.display = 'none';
    dashboard.classList.add('active');
    
    sessionStorage.setItem('nouraUser', username);
    loginForm.reset();
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    expenses = [];
    monthlyBudget = 0;
    sessionStorage.removeItem('nouraUser');
    dashboard.classList.remove('active');
    loginPage.style.display = 'flex';
    loginForm.reset();
    signupForm.reset();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    authMessage.style.display = 'none';
});

// Add Expense Handler
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const expense = {
        id: Date.now(),
        name: document.getElementById('expenseName').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };

    expenses.push(expense);
    saveExpenses();
    expenseForm.reset();
    document.getElementById('date').valueAsDate = new Date();
    updateUI();
    checkBudget();
});

// Budget Management
setBudgetBtn.addEventListener('click', () => {
    const budget = parseFloat(monthlyBudgetInput.value);
    if (budget && budget > 0) {
        monthlyBudget = budget;
        saveBudget();
        checkBudget();
    }
});

function saveBudget() {
    if (!currentUser) return;
    try {
        localStorage.setItem(`noura_budget_${currentUser}`, JSON.stringify(monthlyBudget));
    } catch (error) {
        console.error('Error saving budget:', error);
    }
}

function loadBudget() {
    if (!currentUser) return;
    try {
        const data = localStorage.getItem(`noura_budget_${currentUser}`);
        if (data) {
            monthlyBudget = JSON.parse(data);
            monthlyBudgetInput.value = monthlyBudget;
            checkBudget();
        }
    } catch (error) {
        console.error('Error loading budget:', error);
        monthlyBudget = 0;
    }
}

function checkBudget() {
    if (!monthlyBudget || monthlyBudget === 0) {
        budgetStatus.innerHTML = '';
        return;
    }

    const now = new Date();
    const monthTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === now.getMonth() && 
                   expDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

    const percentage = (monthTotal / monthlyBudget) * 100;
    const remaining = monthlyBudget - monthTotal;

    let statusClass = 'safe';
    let statusEmoji = '✅';
    let statusMessage = `You're within budget!`;
    let statusDetail = `K ${remaining.toFixed(2)} remaining`;

    if (percentage >= 100) {
        statusClass = 'danger';
        statusEmoji = '🚨';
        statusMessage = 'Budget Exceeded!';
        statusDetail = `Over by K ${Math.abs(remaining).toFixed(2)}`;
    } else if (percentage >= 80) {
        statusClass = 'warning';
        statusEmoji = '⚠️';
        statusMessage = 'Approaching Limit';
        statusDetail = `K ${remaining.toFixed(2)} remaining`;
    }

    budgetStatus.className = `budget-status ${statusClass}`;
    budgetStatus.innerHTML = `
        <div style="font-size: 2.5em; margin-bottom: 8px;">${statusEmoji}</div>
        <div style="font-size: 1.2em; font-weight: 800; margin-bottom: 4px;">${statusMessage}</div>
        <div style="font-size: 1em; opacity: 0.9; margin-bottom: 12px;">${statusDetail}</div>
        <div class="budget-progress">
            <div style="display: flex; justify-content: space-between; font-size: 0.8em; margin-bottom: 6px;">
                <span>Spent: K ${monthTotal.toFixed(2)}</span>
                <span>Budget: K ${monthlyBudget.toFixed(2)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div style="margin-top: 6px; font-size: 0.85em; font-weight: 700;">
                ${percentage.toFixed(1)}% Used
            </div>
        </div>
    `;
}

// Export Data
exportBtn.addEventListener('click', () => {
    if (expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }

    const filtered = filterExpenses();
    const csv = generateCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noura_expenses_${currentUser}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

function generateCSV(expensesToExport) {
    const headers = ['Date', 'Name', 'Category', 'Amount (ZMW)', 'Notes'];
    const rows = expensesToExport.map(exp => [
        exp.date,
        exp.name,
        exp.category,
        exp.amount.toFixed(2),
        exp.notes || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

// Filter Handlers
filterCategory.addEventListener('change', updateUI);
filterPeriod.addEventListener('change', updateUI);

// Delete Expense
window.deleteExpense = function(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses();
        updateUI();
        checkBudget();
    }
};

// Update UI
function updateUI() {
    const filtered = filterExpenses();
    displayExpenses(filtered);
    updateStats();
}

// Filter Expenses
function filterExpenses() {
    let filtered = [...expenses];

    const categoryFilter = filterCategory.value;
    if (categoryFilter) {
        filtered = filtered.filter(exp => exp.category === categoryFilter);
    }

    const periodFilter = filterPeriod.value;
    const now = new Date();
    
    if (periodFilter === 'today') {
        filtered = filtered.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.toDateString() === now.toDateString();
        });
    } else if (periodFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(exp => new Date(exp.date) >= weekAgo);
    } else if (periodFilter === 'month') {
        filtered = filtered.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === now.getMonth() && 
                   expDate.getFullYear() === now.getFullYear();
        });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Display Expenses
function displayExpenses(expensesToShow) {
    if (expensesToShow.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <p>No expenses found for the selected filters.</p>
            </div>
        `;
        return;
    }

    expenseList.innerHTML = expensesToShow.map(exp => `
        <div class="expense-item">
            <div class="expense-details">
                <h4>${exp.name}</h4>
                <div class="expense-meta">
                    <span class="category-badge">${exp.category}</span>
                    <span>${new Date(exp.date).toLocaleDateString('en-GB')}</span>
                </div>
                ${exp.notes ? `<p style="color: rgba(229,231,235,0.5); font-size: 0.8em; margin-top: 6px;">${exp.notes}</p>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="expense-amount">K ${exp.amount.toFixed(2)}</div>
                <button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update Statistics
function updateStats() {
    const now = new Date();
    
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('totalExpenses').textContent = `K ${total.toFixed(2)}`;

    const monthTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === now.getMonth() && 
                   expDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('monthExpenses').textContent = `K ${monthTotal.toFixed(2)}`;

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekTotal = expenses
        .filter(exp => new Date(exp.date) >= weekAgo)
        .reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('weekExpenses').textContent = `K ${weekTotal.toFixed(2)}`;

    const todayTotal = expenses
        .filter(exp => new Date(exp.date).toDateString() === now.toDateString())
        .reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('todayExpenses').textContent = `K ${todayTotal.toFixed(2)}`;
}

// Storage Functions
function saveExpenses() {
    if (!currentUser) return;
    try {
        localStorage.setItem(`noura_expenses_${currentUser}`, JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses:', error);
    }
}

function loadExpenses() {
    if (!currentUser) return;
    try {
        const data = localStorage.getItem(`noura_expenses_${currentUser}`);
        if (data) {
            expenses = JSON.parse(data);
            updateUI();
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
    }
}

// Check for existing session
window.addEventListener('load', () => {
    const savedUser = sessionStorage.getItem('nouraUser');
    if (savedUser) {
        currentUser = savedUser;
        userName.textContent = savedUser;
        userAvatar.textContent = savedUser.charAt(0).toUpperCase();
        loadExpenses();
        loadBudget();
        loginPage.style.display = 'none';
        dashboard.classList.add('active');
    }
});