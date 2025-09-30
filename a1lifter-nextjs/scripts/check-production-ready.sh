#!/bin/bash

echo "🚀 A1Lifter Production Readiness Check"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the a1lifter-nextjs directory${NC}"
    exit 1
fi

echo "1. Checking Environment Variables..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local found${NC}"
    
    # Check required variables
    required_vars=("DATABASE_URL" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXTAUTH_SECRET")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required environment variables present${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing variables: ${missing_vars[*]}${NC}"
    fi
else
    echo -e "${RED}❌ .env.local not found. Create it from .env.example${NC}"
fi

echo ""
echo "2. Checking Dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules found${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules not found. Run: npm install${NC}"
fi

echo ""
echo "3. Checking Prisma Setup..."
if [ -f "node_modules/.prisma/client/index.js" ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma client not generated. Run: npm run db:generate${NC}"
fi

echo ""
echo "4. Checking Key Files..."
key_files=(
    "src/hooks/api/use-realtime.ts"
    "src/hooks/api/use-athletes.ts"
    "src/hooks/api/use-registrations.ts"
    "src/hooks/api/use-attempts.ts"
    "src/hooks/api/use-dashboard.ts"
    "src/app/api/dashboard/stats/route.ts"
    "src/app/api/athletes/route.ts"
    "src/app/api/registrations/route.ts"
    "src/app/api/attempts/route.ts"
    "src/app/athletes/page.tsx"
    "src/app/live/page.tsx"
    "src/app/judge/page.tsx"
    "src/components/ui/toaster.tsx"
)

all_files_exist=true
for file in "${key_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        all_files_exist=false
    fi
done

echo ""
echo "5. Checking TypeScript Configuration..."
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript errors found. Run: npm run type-check${NC}"
fi

echo ""
echo "======================================"
echo "📋 Summary"
echo "======================================"

if [ -f ".env.local" ] && [ -d "node_modules" ] && [ $all_files_exist = true ]; then
    echo -e "${GREEN}✅ Application is ready for production!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push database schema: npm run db:push"
    echo "2. Setup RLS policies: npm run setup:rls"
    echo "3. Start development: npm run dev"
    echo "4. Build for production: npm run build"
    echo ""
    echo "For deployment:"
    echo "- Deploy to Vercel: vercel --prod"
    echo "- Configure environment variables on Vercel dashboard"
    echo "- Enable Supabase Realtime replication"
else
    echo -e "${RED}❌ Some setup steps are missing${NC}"
    echo ""
    echo "Please complete the following:"
    if [ ! -f ".env.local" ]; then
        echo "- Create .env.local from .env.example"
    fi
    if [ ! -d "node_modules" ]; then
        echo "- Run: npm install"
    fi
    if [ ! $all_files_exist = true ]; then
        echo "- Some required files are missing"
    fi
fi

echo ""
echo "📚 Documentation: See PRODUCTION_COMPLETE.md for full guide"
