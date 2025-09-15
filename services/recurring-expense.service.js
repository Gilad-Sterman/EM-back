import { logger } from './logger.service.js'

export const recurringExpenseService = {
    generateExpensesFromRecurring
}

/**
 * Generate expenses from recurring templates
 * @param {Array} recurringExpenses - Array of recurring expense templates
 * @param {Array} existingExpenses - Array of existing expenses
 * @param {Date} currentDate - Current date (default: now)
 * @returns {Object} Object containing new expenses and updated recurring expenses
 */
function generateExpensesFromRecurring(recurringExpenses, existingExpenses = [], currentDate = new Date()) {
    const newExpenses = []
    const updatedRecurringExpenses = JSON.parse(JSON.stringify(recurringExpenses))
    
    updatedRecurringExpenses.forEach(recurringExpense => {
        if (!recurringExpense.active) return
        
        // Handle the initial occurrence date based on the recurring expense settings
        let initialDate;
        
        // If this is a newly created recurring expense (no lastGenerated date)
        if (!recurringExpense.lastGenerated) {
            // Start from the startDate
            initialDate = new Date(recurringExpense.startDate);
            
            // For monthly recurring expenses, check if we need to adjust the day
            if (recurringExpense.frequency === 'monthly' && recurringExpense.dayOfMonth) {
                // Set the day of month for the initial date
                initialDate.setDate(recurringExpense.dayOfMonth);
                
                // If the adjusted date is before the start date, move to next month
                if (initialDate < new Date(recurringExpense.startDate)) {
                    initialDate.setMonth(initialDate.getMonth() + 1);
                }
                
                // If the adjusted date is in the future, move back to the start date
                if (initialDate > currentDate) {
                    initialDate = new Date(recurringExpense.startDate);
                }
            }
        } else {
            // Use the last generated date as the starting point
            initialDate = new Date(recurringExpense.lastGenerated);
        }
        
        // Generate the next occurrence date
        let nextDate = getNextOccurrenceDate(initialDate, recurringExpense.frequency, recurringExpense);
        
        // Special case: If this is a new recurring expense and the first payment should be this month
        if (!recurringExpense.lastGenerated && 
            recurringExpense.frequency === 'monthly' && 
            recurringExpense.dayOfMonth) {
            
            // Create a date for this month with the specified day
            const thisMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), recurringExpense.dayOfMonth);
            
            // If the day of month is valid for this month and is in the future (but not past the current date)
            if (thisMonthDate.getMonth() === currentDate.getMonth() && 
                thisMonthDate > new Date(recurringExpense.startDate) && 
                thisMonthDate <= currentDate) {
                
                // Use this month's date as the next occurrence
                nextDate = thisMonthDate;
            }
        }
        
        // Keep generating expenses until we're caught up to current date
        while (nextDate <= currentDate) {
            // Format the date for comparison with existing expenses
            const formattedDate = formatDate(nextDate);
            
            // Check if this expense already exists (avoid duplicates)
            const alreadyExists = existingExpenses.some(expense => 
                expense.isRecurring && 
                expense.recurringId === recurringExpense.id && 
                expense.date === formattedDate
            );
            
            // Only create a new expense if it doesn't already exist
            if (!alreadyExists) {
                // Create a new expense from the template
                const newExpense = {
                    id: generateId(),
                    date: formattedDate,
                    name: recurringExpense.name, // Copy the name field
                    desc: recurringExpense.desc || recurringExpense.name, // Use name as fallback
                    paid: recurringExpense.amount,
                    type: recurringExpense.type,
                    pType: recurringExpense.pType,
                    isRecurring: true,
                    recurringId: recurringExpense.id
                };
                
                newExpenses.push(newExpense);
            }
            
            // Update the last generated date and move to next occurrence
            recurringExpense.lastGenerated = formattedDate;
            const lastGenerated = nextDate;
            nextDate = getNextOccurrenceDate(lastGenerated, recurringExpense.frequency, recurringExpense);
            
            // Safety check: if the next date is the same as the current one, break to avoid infinite loop
            if (isSameDay(nextDate, lastGenerated)) break;
        }
    });
    
    return {
        newExpenses,
        updatedRecurringExpenses
    };
}

// Helper functions
function getNextOccurrenceDate(fromDate, frequency, recurringExpense) {
    const date = new Date(fromDate)
    
    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1)
            break
        case 'weekly':
            date.setDate(date.getDate() + 7)
            break
        case 'monthly':
            const dayOfMonth = recurringExpense.dayOfMonth || date.getDate()
            date.setMonth(date.getMonth() + 1)
            // Handle month length differences
            const monthLength = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
            date.setDate(Math.min(dayOfMonth, monthLength))
            break
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1)
            break
    }
    
    return date
}

function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
}

function generateId() {
    return 'rec_' + Math.random().toString(36).substr(2, 9)
}
