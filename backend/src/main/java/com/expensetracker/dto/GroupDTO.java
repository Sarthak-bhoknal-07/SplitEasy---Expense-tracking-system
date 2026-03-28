package com.expensetracker.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDTO {
    private Long id;
    private String name;
    private String description;
    private UserDTO owner;
    private Set<UserDTO> members;
    private BigDecimal userBalance;
    private BigDecimal totalExpense;
}
