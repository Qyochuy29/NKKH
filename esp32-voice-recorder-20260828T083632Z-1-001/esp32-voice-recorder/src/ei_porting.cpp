// src/ei_porting.cpp
// Cung cấp các hàm porting mà Edge Impulse SDK cần

#include "Arduino.h"
#include <cstdio>
#include <cstdlib>

// In log ra Serial
void ei_printf(const char *format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    Serial.print(buffer);
}

void ei_printf_float(float f) {
    Serial.print(f, 6);
}

// Quản lý bộ nhớ — dùng heap thường (không cần PSRAM cho inference)
void *ei_malloc(size_t size) {
    return malloc(size);
}

void *ei_calloc(size_t nitems, size_t size) {
    return calloc(nitems, size);
}

void ei_free(void *ptr) {
    free(ptr);
}

// Timer — dùng micros() của Arduino
uint64_t ei_read_timer_us() {
    return (uint64_t)micros();
}

uint64_t ei_read_timer_ms() {
    return (uint64_t)millis();
}

// Check cancel — không cancel, luôn trả về false
int ei_run_impulse_check_canceled() {
    return 0;
}

// Sleep
void ei_sleep(int ms) {
    delay(ms);
}