package com.expensetracker.repository;

import com.expensetracker.entity.Settlement;
import com.expensetracker.entity.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findByGroup(ExpenseGroup group);
}
