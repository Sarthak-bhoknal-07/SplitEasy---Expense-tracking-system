package com.expensetracker.repository;

import com.expensetracker.entity.ExpenseGroup;
import com.expensetracker.entity.GroupMemberBalance;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MemberBalanceRepository extends JpaRepository<GroupMemberBalance, Long> {
    List<GroupMemberBalance> findByGroup(ExpenseGroup group);
    Optional<GroupMemberBalance> findByGroupAndUser(ExpenseGroup group, User user);
}
