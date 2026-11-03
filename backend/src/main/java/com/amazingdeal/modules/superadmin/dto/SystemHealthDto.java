package com.amazingdeal.modules.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDto {
    private String status;
    private String database;
    private long totalMemoryMb;
    private long freeMemoryMb;
    private long usedMemoryMb;
    private int availableProcessors;
    private long uptimeSeconds;
    private String javaVersion;
}

