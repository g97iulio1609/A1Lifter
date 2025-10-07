#!/bin/bash

# A1Lifter Development Environment Startup Script
# This script starts all required services for local development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting A1Lifter Development Environment${NC}\n"

# Function to check if a port is in use
check_port() {
  lsof -i :"$1" > /dev/null 2>&1
}

# Function to check if Supabase is running
check_supabase() {
  check_port 54321 && check_port 54322
}

# Function to check if Redis is running
check_redis() {
  check_port 6379
}

# 1. Check and start Supabase
echo -e "${YELLOW}[1/4] Checking Supabase...${NC}"
if check_supabase; then
  echo -e "${GREEN}✓ Supabase is already running${NC}"
else
  echo -e "${YELLOW}→ Starting Supabase...${NC}"
  if command -v supabase &> /dev/null; then
    supabase start
    echo -e "${GREEN}✓ Supabase started${NC}"
  else
    echo -e "${RED}✗ Supabase CLI not found. Please install it:${NC}"
    echo -e "${YELLOW}  brew install supabase/tap/supabase${NC}"
    exit 1
  fi
fi

# 2. Check Redis (optional)
echo -e "\n${YELLOW}[2/4] Checking Redis (optional)...${NC}"
if check_redis; then
  echo -e "${GREEN}✓ Redis is running${NC}"
else
  echo -e "${YELLOW}→ Redis not running (using in-memory cache)${NC}"
  if command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}  To enable Redis cache, run: redis-server &${NC}"
  fi
fi

# 3. Apply database migrations
echo -e "\n${YELLOW}[3/4] Checking database migrations...${NC}"
if npx prisma migrate status 2>&1 | grep -q "have not yet been applied"; then
  echo -e "${YELLOW}→ Applying pending migrations...${NC}"
  npx prisma migrate deploy
  echo -e "${GREEN}✓ Migrations applied${NC}"
else
  echo -e "${GREEN}✓ Database is up to date${NC}"
fi

# 4. Start Next.js
echo -e "\n${YELLOW}[4/4] Starting Next.js development server...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Trap SIGINT and SIGTERM to clean up
cleanup() {
  echo -e "\n\n${YELLOW}Stopping development server...${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start Next.js
next dev
