package com.expensetracker.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementDTO {
    private Long id;
    private Long groupId;
    private UserDTO from;
    private UserDTO to;
    private BigDecimal amount;
    private LocalDate date;
}
