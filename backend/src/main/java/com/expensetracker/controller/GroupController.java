package com.expensetracker.controller;

import com.expensetracker.dto.BalanceDTO;
import com.expensetracker.dto.DebtDTO;
import com.expensetracker.dto.GroupDTO;
import com.expensetracker.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupDTO> createGroup(@RequestBody Map<String, String> payload, Authentication authentication) {
        GroupDTO group = groupService.createGroup(
                payload.get("name"),
                payload.get("description"),
                authentication.getName()
        );
        return ResponseEntity.ok(group);
    }

    @GetMapping
    public ResponseEntity<List<GroupDTO>> getUserGroups(Authentication authentication) {
        return ResponseEntity.ok(groupService.getUserGroups(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDTO> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroup(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        groupService.addMember(id, payload.get("email"));
        return ResponseEntity.ok("Member added successfully");
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        groupService.removeMember(id, userId);
        return ResponseEntity.ok("Member removed successfully");
    }

    @GetMapping("/{id}/balances")
    public ResponseEntity<List<BalanceDTO>> getGroupBalances(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupBalances(id));
    }

    @GetMapping("/{id}/debts")
    public ResponseEntity<List<DebtDTO>> getSimplifiedDebts(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getSimplifiedDebts(id));
    }
}
