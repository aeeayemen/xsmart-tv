-- backend/database_schema.sql
-- Run this block in your phpMyAdmin SQL tab to create the tables

CREATE DATABASE IF NOT EXISTS xsmart_tv_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xsmart_tv_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    exp_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 YEAR),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('vod', 'series', 'live') NOT NULL,
    stream_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, type, stream_id)
);
