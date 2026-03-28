package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import com.expensetracker.entity.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroup(ExpenseGroup group);
}
