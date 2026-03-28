package com.expensetracker.repository;

import com.expensetracker.entity.ExpenseGroup;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupRepository extends JpaRepository<ExpenseGroup, Long> {
    List<ExpenseGroup> findByMembersContaining(User user);
    List<ExpenseGroup> findByOwner(User owner);
}
