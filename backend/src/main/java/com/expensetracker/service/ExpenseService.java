package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDTO;
import com.expensetracker.dto.Mapper;
import com.expensetracker.dto.SplitDTO;
import com.expensetracker.entity.*;
import com.expensetracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CurrencyService currencyService;

    @Autowired
    private MemberBalanceRepository memberBalanceRepository;

    @Transactional
    public ExpenseDTO addExpense(Long groupId, ExpenseDTO expenseDTO, String currentUserEmail) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        User payer;
        if (expenseDTO.getPaidBy() != null && expenseDTO.getPaidBy().getId() != null) {
            payer = userRepository.findById(expenseDTO.getPaidBy().getId())
                    .orElseThrow(() -> new RuntimeException("Payer not found"));
        } else {
            payer = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));
        }

        BigDecimal originalAmount = expenseDTO.getAmount();
        if (originalAmount == null || originalAmount.compareTo(BigDecimal.ZERO) <= 0) {
             throw new RuntimeException("Amount must be greater than zero");
        }
        String originalCurrency = expenseDTO.getCurrency() != null ? expenseDTO.getCurrency() : "INR";
        BigDecimal convertedAmountINR = currencyService.convertToINR(originalAmount, originalCurrency);

        Expense expense = new Expense();
        expense.setTitle(expenseDTO.getTitle());
        expense.setAmount(convertedAmountINR); // Using INR amount for primary calculation
        expense.setOriginalAmount(originalAmount);
        expense.setOriginalCurrency(originalCurrency);
        expense.setConvertedAmountINR(convertedAmountINR);
        expense.setGroup(group);
        expense.setPaidBy(payer);
        expense.setDate(expenseDTO.getDate() != null ? expenseDTO.getDate() : java.time.LocalDate.now());

        List<ExpenseSplit> splits = new ArrayList<>();
        
        if (expenseDTO.getSplits() == null || expenseDTO.getSplits().isEmpty()) {
            distributeEqually(expense, group, splits);
        } else {
            BigDecimal totalSplitOriginal = expenseDTO.getSplits().stream()
                    .map(SplitDTO::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            if (totalSplitOriginal.setScale(2, RoundingMode.HALF_UP).compareTo(originalAmount.setScale(2, RoundingMode.HALF_UP)) != 0) {
                 throw new RuntimeException("Splits (" + totalSplitOriginal + ") do not sum up to total amount (" + originalAmount + ")");
            }
            
            // Get the actual conversion rate used for this expense
            BigDecimal rate = convertedAmountINR.divide(originalAmount, 10, RoundingMode.HALF_UP);

            for(SplitDTO splitDTO : expenseDTO.getSplits()) {
                User splitUser = userRepository.findById(splitDTO.getUser().getId())
                        .orElseThrow(() -> new RuntimeException("User in split not found"));
                ExpenseSplit split = new ExpenseSplit();
                split.setExpense(expense);
                split.setUser(splitUser);
                // Convert each split to INR using the same rate
                BigDecimal splitAmountOriginal = splitDTO.getAmount();
                BigDecimal splitAmountINR = splitAmountOriginal.multiply(rate).setScale(2, RoundingMode.HALF_UP);
                split.setAmount(splitAmountINR);
                split.setOriginalAmount(splitAmountOriginal);
                splits.add(split);
            }
            
            // Adjust any rounding differences in splits to match convertedAmountINR
            BigDecimal totalSplitsINR = splits.stream().map(ExpenseSplit::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (!totalSplitsINR.equals(convertedAmountINR) && !splits.isEmpty()) {
                BigDecimal diff = convertedAmountINR.subtract(totalSplitsINR);
                splits.get(0).setAmount(splits.get(0).getAmount().add(diff));
            }
        }
        
        expense.setSplits(splits);
        Expense saved = expenseRepository.save(expense);
        
        // UPDATE GROUP BALANCES
        updateBalancesForExpense(group, payer, splits, false);
        
        return Mapper.toExpenseDTO(saved);
    }

    private void updateBalancesForExpense(ExpenseGroup group, User payer, List<ExpenseSplit> splits, boolean isDelete) {
        // Payer balance increases if not deleting, decreases if deleting
        BigDecimal totalAmount = splits.stream().map(ExpenseSplit::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        GroupMemberBalance payerBalance = memberBalanceRepository.findByGroupAndUser(group, payer)
                .orElseGet(() -> GroupMemberBalance.builder().group(group).user(payer).balance(BigDecimal.ZERO).build());
        
        if (isDelete) {
            payerBalance.setBalance(payerBalance.getBalance().subtract(totalAmount));
        } else {
            payerBalance.setBalance(payerBalance.getBalance().add(totalAmount));
        }
        memberBalanceRepository.save(payerBalance);
        
        // Members in split decrease if not deleting, increase if deleting
        for (ExpenseSplit split : splits) {
            GroupMemberBalance memberBalance = memberBalanceRepository.findByGroupAndUser(group, split.getUser())
                    .orElseGet(() -> GroupMemberBalance.builder().group(group).user(split.getUser()).balance(BigDecimal.ZERO).build());
            
            if (isDelete) {
                memberBalance.setBalance(memberBalance.getBalance().add(split.getAmount()));
            } else {
                memberBalance.setBalance(memberBalance.getBalance().subtract(split.getAmount()));
            }
            memberBalanceRepository.save(memberBalance);
        }
    }

    private void distributeEqually(Expense expense, ExpenseGroup group, List<ExpenseSplit> splits) {
        int memberCount = group.getMembers().size();
        if (memberCount == 0) return;

        BigDecimal totalAmountINR = expense.getAmount(); // This is already INR
        BigDecimal splitAmountINR = totalAmountINR.divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.DOWN);
        BigDecimal remainderINR = totalAmountINR.subtract(splitAmountINR.multiply(BigDecimal.valueOf(memberCount)));

        BigDecimal totalAmountOriginal = expense.getOriginalAmount();
        BigDecimal splitAmountOriginal = totalAmountOriginal.divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.DOWN);
        BigDecimal remainderOriginal = totalAmountOriginal.subtract(splitAmountOriginal.multiply(BigDecimal.valueOf(memberCount)));
        
        int i = 0;
        for (User member : group.getMembers()) {
            ExpenseSplit split = new ExpenseSplit();
            split.setExpense(expense);
            split.setUser(member);
            BigDecimal amountINR = splitAmountINR;
            BigDecimal amountOriginal = splitAmountOriginal;
            if (i == 0) { // Add remainder to the first member
                amountINR = amountINR.add(remainderINR);
                amountOriginal = amountOriginal.add(remainderOriginal);
            }
            split.setAmount(amountINR);
            split.setOriginalAmount(amountOriginal);
            splits.add(split);
            i++;
        }
    }

    public List<ExpenseDTO> getGroupExpenses(Long groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return expenseRepository.findByGroup(group).stream()
                .map(Mapper::toExpenseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteExpense(Long expenseId, String userEmail) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only group owner or expense payer can delete
        if (!expense.getGroup().getOwner().equals(user) && !expense.getPaidBy().equals(user)) {
            throw new RuntimeException("You do not have permission to delete this expense");
        }
        
        // UPDATE BALANCES (isDelete = true)
        updateBalancesForExpense(expense.getGroup(), expense.getPaidBy(), expense.getSplits(), true);
        
        expenseRepository.delete(expense);
    }
        
    public byte[] exportToCSV(Long groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        List<Expense> expenses = expenseRepository.findByGroup(group);
        
        StringBuilder csv = new StringBuilder();
        csv.append("\"Date\",\"Title\",\"Paid By\",\"Original Amount\",\"Original Currency\",\"Amount (INR)\"\n");
        
        for (Expense expense : expenses) {
            String title = expense.getTitle() != null ? expense.getTitle().replace("\"", "\"\"") : "";
            String paidBy = expense.getPaidBy() != null ? expense.getPaidBy().getName().replace("\"", "\"\"") : "Unknown";
            
            csv.append("\"").append(expense.getDate()).append("\",")
               .append("\"").append(title).append("\",")
               .append("\"").append(paidBy).append("\",")
               .append("\"").append(expense.getOriginalAmount()).append("\",")
               .append("\"").append(expense.getOriginalCurrency()).append("\",")
               .append("\"").append(expense.getAmount()).append("\"\n");
        }
        
        return csv.toString().getBytes();
    }
}
