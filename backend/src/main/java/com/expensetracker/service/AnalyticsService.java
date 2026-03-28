package com.expensetracker.service;

import com.expensetracker.entity.Expense;
import com.expensetracker.entity.ExpenseGroup;
import com.expensetracker.entity.ExpenseSplit;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private GroupRepository groupRepository;

    public Map<String, BigDecimal> getMonthlyExpenses(Long groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        List<Expense> expenses = expenseRepository.findByGroup(group);
        
        Map<String, BigDecimal> monthlyTotal = new HashMap<>();
        for (Expense expense : expenses) {
            String month = expense.getDate().getMonth().toString() + " " + expense.getDate().getYear();
            monthlyTotal.put(month, monthlyTotal.getOrDefault(month, BigDecimal.ZERO).add(expense.getAmount()));
        }
        
        return monthlyTotal;
    }

    public Map<String, Object> getGroupSummary(Long groupId, String userEmail) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        List<Expense> expenses = expenseRepository.findByGroup(group);
        
        BigDecimal totalExpense = BigDecimal.ZERO;
        BigDecimal userPaid = BigDecimal.ZERO;
        BigDecimal userShare = BigDecimal.ZERO;
        
        for (Expense expense : expenses) {
            totalExpense = totalExpense.add(expense.getAmount());
            if (expense.getPaidBy().getEmail().equals(userEmail)) {
                userPaid = userPaid.add(expense.getAmount());
            }
            
            for (ExpenseSplit split : expense.getSplits()) {
                if (split.getUser().getEmail().equals(userEmail)) {
                    userShare = userShare.add(split.getAmount());
                }
            }
        }
        
        BigDecimal balance = userPaid.subtract(userShare);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalExpense", totalExpense);
        summary.put("userPaid", userPaid);
        summary.put("userShare", userShare);
        summary.put("lent", balance.compareTo(BigDecimal.ZERO) > 0 ? balance : BigDecimal.ZERO);
        summary.put("borrow", balance.compareTo(BigDecimal.ZERO) < 0 ? balance.abs() : BigDecimal.ZERO);
        
        return summary;
    }
}
