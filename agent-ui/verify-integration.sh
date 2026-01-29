#!/bin/bash

# Integration Verification Script
# This script runs automated checks to verify the Agent UI integration

set -e

echo "========================================="
echo "Agent UI Integration Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Helper function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $2"
    ((FAILED++))
  fi
}

echo "1. Running Unit Tests..."
echo "-------------------------------------------"
npm test -- --reporter=verbose 2>&1 | tee test-output.log
TEST_EXIT_CODE=${PIPESTATUS[0]}

if [ $TEST_EXIT_CODE -eq 0 ]; then
  print_result 0 "All unit tests passed"
else
  print_result 1 "Some unit tests failed (see test-output.log)"
fi

echo ""
echo "2. Running TypeScript Type Checking..."
echo "-------------------------------------------"
npx tsc --noEmit
TSC_EXIT_CODE=$?
print_result $TSC_EXIT_CODE "TypeScript type checking"

echo ""
echo "3. Running ESLint..."
echo "-------------------------------------------"
npm run lint 2>&1 | head -20
LINT_EXIT_CODE=${PIPESTATUS[0]}
print_result $LINT_EXIT_CODE "ESLint checks"

echo ""
echo "4. Checking Build..."
echo "-------------------------------------------"
npm run build > /dev/null 2>&1
BUILD_EXIT_CODE=$?
print_result $BUILD_EXIT_CODE "Production build"

echo ""
echo "5. Verifying File Structure..."
echo "-------------------------------------------"

# Check critical files exist
FILES=(
  "src/App.tsx"
  "src/main.tsx"
  "src/components/SideNavigation.tsx"
  "src/components/ChatWindow.tsx"
  "src/components/ChatInput.tsx"
  "src/components/ResponseViewer.tsx"
  "src/components/TabBar.tsx"
  "src/components/TemplateTab.tsx"
  "src/components/ProgressTab.tsx"
  "src/services/agentService.ts"
  "src/services/storageService.ts"
  "src/services/deploymentPollingService.ts"
  "src/utils/responseParser.ts"
  "src/utils/errorLogger.ts"
  "src/context/AppContext.tsx"
  "src/types/index.ts"
)

ALL_FILES_EXIST=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${RED}✗${NC} $file missing"
    ALL_FILES_EXIST=1
  fi
done

print_result $ALL_FILES_EXIST "All critical files present"

echo ""
echo "6. Verifying Component Exports..."
echo "-------------------------------------------"

# Check that components are properly exported
if grep -q "export default" src/components/SideNavigation.tsx; then
  print_result 0 "SideNavigation exports correctly"
else
  print_result 1 "SideNavigation export issue"
fi

if grep -q "export default" src/components/ChatWindow.tsx; then
  print_result 0 "ChatWindow exports correctly"
else
  print_result 1 "ChatWindow export issue"
fi

if grep -q "export default" src/components/ResponseViewer.tsx; then
  print_result 0 "ResponseViewer exports correctly"
else
  print_result 1 "ResponseViewer export issue"
fi

echo ""
echo "7. Verifying Service Functions..."
echo "-------------------------------------------"

# Check that services export required functions
if grep -q "export.*invokeAgent" src/services/agentService.ts; then
  print_result 0 "invokeAgent function exists"
else
  print_result 1 "invokeAgent function missing"
fi

if grep -q "export.*startPolling" src/services/deploymentPollingService.ts; then
  print_result 0 "startPolling function exists"
else
  print_result 1 "startPolling function missing"
fi

if grep -q "export.*parseAgentResponse" src/utils/responseParser.ts; then
  print_result 0 "parseAgentResponse function exists"
else
  print_result 1 "parseAgentResponse function missing"
fi

echo ""
echo "8. Verifying Dependencies..."
echo "-------------------------------------------"

# Check critical dependencies are installed
DEPS=(
  "react"
  "react-dom"
  "typescript"
  "tailwindcss"
  "prismjs"
  "marked"
  "vitest"
)

ALL_DEPS_INSTALLED=0
for dep in "${DEPS[@]}"; do
  if npm list "$dep" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $dep installed"
  else
    echo -e "${RED}✗${NC} $dep not installed"
    ALL_DEPS_INSTALLED=1
  fi
done

print_result $ALL_DEPS_INSTALLED "All dependencies installed"

echo ""
echo "========================================="
echo "Integration Verification Summary"
echo "========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All automated checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Start the development server: npm run dev"
  echo "2. Open http://localhost:5173 in your browser"
  echo "3. Complete the manual test checklist in INTEGRATION-TEST-CHECKLIST.md"
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Please review the output above.${NC}"
  exit 1
fi
