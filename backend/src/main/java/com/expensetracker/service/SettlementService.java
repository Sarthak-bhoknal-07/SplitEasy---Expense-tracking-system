package com.expensetracker.service;

import com.expensetracker.dto.Mapper;
import com.expensetracker.dto.SettlementDTO;
import com.expensetracker.entity.ExpenseGroup;
import com.expensetracker.entity.GroupMemberBalance;
import com.expensetracker.entity.Settlement;
import com.expensetracker.entity.User;
import com.expensetracker.repository.GroupRepository;
import com.expensetracker.repository.MemberBalanceRepository;
import com.expensetracker.repository.SettlementRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SettlementService {

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberBalanceRepository memberBalanceRepository;

    @Transactional
    public SettlementDTO createSettlement(Long groupId, SettlementDTO settlementDTO) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        User from = userRepository.findById(settlementDTO.getFrom().getId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        User to = userRepository.findById(settlementDTO.getTo().getId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        
        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setFrom(from);
        settlement.setTo(to);
        settlement.setAmount(settlementDTO.getAmount());
        settlement.setDate(java.time.LocalDate.now());
        
        Settlement saved = settlementRepository.save(settlement);
        
        // UPDATE BALANCES
        GroupMemberBalance fromBalance = memberBalanceRepository.findByGroupAndUser(group, from)
                .orElseGet(() -> GroupMemberBalance.builder().group(group).user(from).balance(BigDecimal.ZERO).build());
        fromBalance.setBalance(fromBalance.getBalance().add(settlementDTO.getAmount()));
        memberBalanceRepository.save(fromBalance);
        
        GroupMemberBalance toBalance = memberBalanceRepository.findByGroupAndUser(group, to)
                .orElseGet(() -> GroupMemberBalance.builder().group(group).user(to).balance(BigDecimal.ZERO).build());
        toBalance.setBalance(toBalance.getBalance().subtract(settlementDTO.getAmount()));
        memberBalanceRepository.save(toBalance);
        
        return Mapper.toSettlementDTO(saved);
    }

    public List<SettlementDTO> getGroupSettlements(Long groupId) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return settlementRepository.findByGroup(group).stream()
                .map(Mapper::toSettlementDTO)
                .collect(Collectors.toList());
    }
}
