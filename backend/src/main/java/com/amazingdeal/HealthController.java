package com.amazingdeal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long usedHeapMb = memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);
        long maxHeapMb = memoryBean.getHeapMemoryUsage().getMax() / (1024 * 1024);

        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "amazingdeal-backend",
                "domain", "amazingdeal.co.in",
                "timestamp", Instant.now().toString(),
                "memoryUsage", String.format("%d MB / %d MB", usedHeapMb, maxHeapMb),
                "uptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000
        ));
    }
}
