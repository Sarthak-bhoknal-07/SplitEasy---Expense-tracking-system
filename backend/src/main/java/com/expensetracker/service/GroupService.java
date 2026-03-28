package com.expensetracker.service;

import com.expensetracker.dto.BalanceDTO;
import com.expensetracker.dto.DebtDTO;
import com.expensetracker.dto.GroupDTO;
import com.expensetracker.dto.Mapper;
import com.expensetracker.entity.*;
import com.expensetracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private MemberBalanceRepository memberBalanceRepository;

    public GroupDTO createGroup(String name, String description, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ExpenseGroup group = new ExpenseGroup();
        group.setName(name);
        group.setDescription(description);
        group.setOwner(owner);
        group.setMembers(new HashSet<>());
        group.getMembers().add(owner);
        
        ExpenseGroup saved = groupRepository.save(group);
        
        // Initialize balance
        GroupMemberBalance balance = new GroupMemberBalance();
        balance.setGroup(saved);
        balance.setUser(owner);
        balance.setBalance(BigDecimal.ZERO);
        memberBalanceRepository.save(balance);
        
        return Mapper.toGroupDTO(saved);
    }

    public List<GroupDTO> getUserGroups(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return groupRepository.findByMembersContaining(user).stream()
                .map(group -> {
                    BigDecimal userBalance = memberBalanceRepository.findByGroupAndUser(group, user)
                            .map(GroupMemberBalance::getBalance)
                            .orElse(BigDecimal.ZERO);
                    
                    BigDecimal totalExpense = expenseRepository.findByGroup(group).stream()
                            .map(Expense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    return Mapper.toGroupDTO(group, user, userBalance, totalExpense);
                })
                .collect(Collectors.toList());
    }

    public void addMember(Long groupId, String email) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        if (group.getMembers().contains(user)) {
             throw new RuntimeException("User is already a member of this group");
        }
        
        group.getMembers().add(user);
        groupRepository.save(group);
        
        // Initialize balance
        GroupMemberBalance balance = new GroupMemberBalance();
        balance.setGroup(group);
        balance.setUser(user);
        balance.setBalance(BigDecimal.ZERO);
        memberBalanceRepository.save(balance);
    }

    public void removeMember(Long groupId, Long userId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (group.getOwner().equals(user)) {
            throw new RuntimeException("Cannot remove the group owner");
        }
        
        group.getMembers().remove(user);
        groupRepository.save(group);
        
        // Remove balance entry
        memberBalanceRepository.findByGroupAndUser(group, user)
                .ifPresent(b -> memberBalanceRepository.delete(b));
    }

    public GroupDTO getGroup(Long id) {
        ExpenseGroup group = groupRepository.findById(id).orElseThrow(() -> new RuntimeException("Group not found"));
        return Mapper.toGroupDTO(group);
    }

    public List<BalanceDTO> getGroupBalances(Long groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        return memberBalanceRepository.findByGroup(group).stream()
                .map(mb -> BalanceDTO.builder()
                        .user(Mapper.toUserDTO(mb.getUser()))
                        .balance(mb.getBalance())
                        .build())
                .collect(Collectors.toList());
    }

    @Autowired
    private CurrencyService currencyService;

    public List<DebtDTO> getSimplifiedDebts(Long groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Find most common non-INR original currency used in this group
        List<Expense> groupExpenses = expenseRepository.findByGroup(group);
        String repCurrency = groupExpenses.stream()
                .map(Expense::getOriginalCurrency)
                .filter(c -> !"INR".equalsIgnoreCase(c))
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("INR");

        List<BalanceDTO> balances = getGroupBalances(groupId);
        
        List<BalanceDTO> debtors = balances.stream()
                .filter(b -> b.getBalance().compareTo(BigDecimal.ZERO) < 0)
                .map(b -> BalanceDTO.builder()
                        .user(b.getUser())
                        .balance(b.getBalance().negate())
                        .build())
                .collect(Collectors.toList());
                
        List<BalanceDTO> creditors = balances.stream()
                .filter(b -> b.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .map(b -> BalanceDTO.builder()
                        .user(b.getUser())
                        .balance(b.getBalance())
                        .build())
                .collect(Collectors.toList());
        
        List<DebtDTO> debts = new ArrayList<>();
        
        int debtorIdx = 0;
        int creditorIdx = 0;
        
        while (debtorIdx < debtors.size() && creditorIdx < creditors.size()) {
            BalanceDTO debtor = debtors.get(debtorIdx);
            BalanceDTO creditor = creditors.get(creditorIdx);
            
            BigDecimal amount = debtor.getBalance().min(creditor.getBalance());
            
            if (amount.compareTo(new BigDecimal("0.01")) >= 0) {
                BigDecimal inrAmount = amount.setScale(2, RoundingMode.HALF_UP);
                BigDecimal origAmount = currencyService.convertFromINR(inrAmount, repCurrency);
                
                debts.add(DebtDTO.builder()
                        .from(debtor.getUser())
                        .to(creditor.getUser())
                        .amount(inrAmount)
                        .originalAmount(origAmount)
                        .originalCurrency(repCurrency)
                        .build());
            }
            
            debtor.setBalance(debtor.getBalance().subtract(amount));
            creditor.setBalance(creditor.getBalance().subtract(amount));
            
            if (debtor.getBalance().compareTo(new BigDecimal("0.01")) < 0) debtorIdx++;
            if (creditor.getBalance().compareTo(new BigDecimal("0.01")) < 0) creditorIdx++;
        }
        
        return debts;
    }
}
