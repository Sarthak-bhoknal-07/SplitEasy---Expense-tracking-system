package com.expensetracker.dto;

import com.expensetracker.entity.*;
import java.math.BigDecimal;
import java.util.stream.Collectors;
import java.util.Collections;

public class Mapper {

    public static UserDTO toUserDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public static GroupDTO toGroupDTO(ExpenseGroup group) {
        return toGroupDTO(group, null, null, null);
    }

    public static GroupDTO toGroupDTO(ExpenseGroup group, User user, BigDecimal userBalance, BigDecimal totalExpense) {
        if (group == null) return null;
        return GroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .owner(toUserDTO(group.getOwner()))
                .members(group.getMembers().stream().map(Mapper::toUserDTO).collect(Collectors.toSet()))
                .userBalance(userBalance)
                .totalExpense(totalExpense)
                .build();
    }

    public static SplitDTO toSplitDTO(ExpenseSplit split) {
        if (split == null) return null;
        return SplitDTO.builder()
                .id(split.getId())
                .user(toUserDTO(split.getUser()))
                .amount(split.getAmount())
                .originalAmount(split.getOriginalAmount())
                .build();
    }

    public static ExpenseDTO toExpenseDTO(Expense expense) {
        if (expense == null) return null;
        return ExpenseDTO.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .originalAmount(expense.getOriginalAmount())
                .originalCurrency(expense.getOriginalCurrency())
                .convertedAmountINR(expense.getConvertedAmountINR())
                .amountInr(expense.getConvertedAmountINR())
                .currency(expense.getOriginalCurrency()) // For compatibility
                .paidBy(toUserDTO(expense.getPaidBy()))
                .groupId(expense.getGroup().getId())
                .date(expense.getDate())
                .splits(expense.getSplits() != null ? 
                    expense.getSplits().stream().map(Mapper::toSplitDTO).collect(Collectors.toList()) : 
                    Collections.emptyList())
                .build();
    }

    public static SettlementDTO toSettlementDTO(Settlement settlement) {
        if (settlement == null) return null;
        return SettlementDTO.builder()
                .id(settlement.getId())
                .groupId(settlement.getGroup().getId())
                .from(toUserDTO(settlement.getFrom()))
                .to(toUserDTO(settlement.getTo()))
                .amount(settlement.getAmount())
                .date(settlement.getDate())
                .build();
    }
}
