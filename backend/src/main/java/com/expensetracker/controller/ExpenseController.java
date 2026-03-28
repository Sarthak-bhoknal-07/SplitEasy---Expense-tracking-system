package com.expensetracker.controller;

import com.expensetracker.dto.ExpenseDTO;
import com.expensetracker.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @PostMapping("/group/{groupId}")
    public ResponseEntity<ExpenseDTO> addExpense(@PathVariable Long groupId, @RequestBody ExpenseDTO expenseDTO, Authentication authentication) {
        return ResponseEntity.ok(expenseService.addExpense(groupId, expenseDTO, authentication.getName()));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ExpenseDTO>> getGroupExpenses(@PathVariable Long groupId) {
        return ResponseEntity.ok(expenseService.getGroupExpenses(groupId));
    }

    @GetMapping("/group/{groupId}/export")
    public ResponseEntity<byte[]> exportGroupExpenses(@PathVariable Long groupId) {
        byte[] csvData = expenseService.exportToCSV(groupId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=expenses.csv")
                .header("Content-Type", "text/csv")
                .body(csvData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id, Authentication authentication) {
        expenseService.deleteExpense(id, authentication.getName());
        return ResponseEntity.ok("Expense deleted successfully");
    }
}
