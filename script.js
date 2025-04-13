// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

class FinanceManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.form = document.getElementById('transactionForm');
        this.transactionsList = document.getElementById('transactionsList');
        this.totalBalance = document.getElementById('totalBalance');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.monthFilter = document.getElementById('monthFilter');
        this.expensesChart = document.getElementById('expensesChart');
        this.balanceChart = document.getElementById('balanceChart');
        this.editingId = null;

        this.initializeEventListeners();
        this.updateDisplay();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.categoryFilter.addEventListener('change', () => this.updateDisplay());
        this.monthFilter.addEventListener('change', () => this.updateDisplay());
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const transaction = {
            id: Date.now(),
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };

        this.transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.form.reset();
        this.updateDisplay();
    }

    updateDisplay() {
        this.filterTransactions();
        this.updateBalance();
        this.updateTransactionsList();
        this.updateCharts();
    }

    filterTransactions() {
        let filtered = [...this.transactions];
        const categoryValue = this.categoryFilter.value;
        const monthValue = this.monthFilter.value;

        if (categoryValue !== 'all') {
            filtered = filtered.filter(t => t.category === categoryValue);
        }

        if (monthValue) {
            filtered = filtered.filter(t => t.date.startsWith(monthValue));
        }

        return filtered;
    }

    updateBalance() {
        const total = this.transactions.reduce((acc, transaction) => {
            return transaction.type === 'income' 
                ? acc + transaction.amount 
                : acc - transaction.amount;
        }, 0);

        this.totalBalance.textContent = `R$ ${total.toFixed(2)}`;
    }

    updateTransactionsList() {
        const filtered = this.filterTransactions();
        this.transactionsList.innerHTML = filtered
            .map(transaction => `
                <li class="transaction-item ${transaction.type}" data-category="${transaction.category}">
                    <div class="transaction-info">
                        <span class="description">${transaction.description}</span>
                        <span class="category">${transaction.category}</span>
                        <span class="date">${transaction.date}</span>
                        <span class="amount">R$ ${transaction.amount.toFixed(2)}</span>
                    </div>
                    <div class="transaction-actions">
                        <button class="edit-btn" data-id="${transaction.id}">
                            ✏️ Editar
                        </button>
                        <button class="delete-btn" data-id="${transaction.id}">
                            🗑️ Excluir
                        </button>
                    </div>
                </li>
            `).join('');

        // Add event listeners to buttons
        this.transactionsList.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                this.editTransaction(id);
            });
        });

        this.transactionsList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                if (confirm('Tem certeza que deseja excluir esta transação?')) {
                    this.deleteTransaction(id);
                }
            });
        });
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Store the ID being edited
        this.editingId = id;

        // Fill the form with transaction data
        document.getElementById('description').value = transaction.description;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('type').value = transaction.type;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;

        // Change button text
        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Atualizar';
        
        // Scroll to form
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const transaction = {
            id: this.editingId || Date.now(),
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };

        if (this.editingId) {
            // Update existing transaction
            const index = this.transactions.findIndex(t => t.id === this.editingId);
            if (index !== -1) {
                this.transactions[index] = transaction;
            }
            this.editingId = null;
            this.form.querySelector('button[type="submit"]').textContent = 'Adicionar';
        } else {
            // Add new transaction
            this.transactions.push(transaction);
        }

        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.form.reset();
        this.updateDisplay();
    }

    // Add deleteTransaction method
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.updateDisplay();
    }

    // Keep only one version of updateExpensesChart (the more detailed one)
    updateExpensesChart() {
        const filtered = this.filterTransactions();
        const expenses = filtered.filter(t => t.type === 'expense');
        const categories = {};
        
        expenses.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });

        // Sort categories by amount
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

        new Chart(this.expensesChart, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sortedCategories),
                datasets: [{
                    data: Object.values(sortedCategories),
                    backgroundColor: [
                        '#00b09b',  // Verde principal
                        '#2ecc71',   // Verde secundário
                        '#3498db',   // Azul
                        '#9b59b6',   // Roxo
                        '#e74c3c',   // Vermelho
                        '#f1c40f'    // Amarelo
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 10,
                            padding: 8,
                            font: {
                                size: 11
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Despesas por Categoria',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });
    }

    updateBalanceChart() {  // Changed from function declaration to class method
        const ctx = this.balanceChart.getContext('2d');
        
        // Sort transactions by date
        const sortedTransactions = this.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Rest of the method remains the same
        const monthlyData = {};
        let runningBalance = 0;
        
        sortedTransactions.forEach(transaction => {
            const monthYear = transaction.date.substring(0, 7);
            const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
            runningBalance += amount;
            monthlyData[monthYear] = runningBalance;
        });
    
        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData);
    
        // If there's an existing chart, destroy it
        if (window.balanceChart instanceof Chart) {
            window.balanceChart.destroy();
        }
    
        window.balanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Saldo Mensal',
                    data: data,
                    borderColor: '#00b09b',
                    backgroundColor: 'rgba(0, 176, 155, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#2ecc71',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        // Clear previous charts if they exist
        if (this.expensesChart) {
            Chart.getChart(this.expensesChart)?.destroy();
        }
        if (this.balanceChart) {
            Chart.getChart(this.balanceChart)?.destroy();
        }
        
        this.updateExpensesChart();
        this.updateBalanceChart();
    }

    // Add deleteTransaction method
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.updateDisplay();
    }
}

let financeManager;
document.addEventListener('DOMContentLoaded', () => {
    financeManager = new FinanceManager();
});