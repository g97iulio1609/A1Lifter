#!/bin/bash

# A1Lifter Development Environment Shutdown Script
# This script stops all development services

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping A1Lifter Development Environment${NC}\n"

# Stop Supabase
echo -e "${YELLOW}Stopping Supabase...${NC}"
if command -v supabase &> /dev/null; then
  supabase stop
  echo -e "${GREEN}✓ Supabase stopped${NC}"
else
  echo -e "${YELLOW}→ Supabase CLI not found${NC}"
fi

# Note about Redis (if user started it manually)
echo -e "\n${YELLOW}Note: If you started Redis manually, stop it with:${NC}"
echo -e "${YELLOW}  redis-cli shutdown${NC}"

echo -e "\n${GREEN}✓ Development environment stopped${NC}"
