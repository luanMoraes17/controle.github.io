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
                <li class="transaction-item ${transaction.type}">
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
        const expenses = this.transactions.filter(t => t.type === 'expense');
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
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Despesas por Categoria'
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return data.labels.map((label, i) => ({
                                    text: `${label} - R$ ${data.datasets[0].data[i].toFixed(2)} (${((data.datasets[0].data[i]/total)*100).toFixed(1)}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: isNaN(data.datasets[0].data[i]),
                                    index: i
                                }));
                            }
                        }
                    }
                }
            }
        });
    }

    updateBalanceChart() {
        const monthlyBalance = {};
        
        this.transactions.forEach(transaction => {
            const month = transaction.date.substring(0, 7);
            const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
            monthlyBalance[month] = (monthlyBalance[month] || 0) + amount;
        });

        new Chart(this.balanceChart, {
            type: 'line',
            data: {
                labels: Object.keys(monthlyBalance),
                datasets: [{
                    label: 'Saldo Mensal',
                    data: Object.values(monthlyBalance),
                    borderColor: '#2ecc71',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(46, 204, 113, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução do Saldo'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
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