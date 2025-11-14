.PHONY: help lint lint-yaml lint-actions lint-markdown lint-ts fix install-lint-tools

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install-lint-tools: ## Install all linting tools
	@echo "Installing linting tools..."
	@command -v yamllint >/dev/null 2>&1 || pip install yamllint
	@command -v actionlint >/dev/null 2>&1 || (echo "Installing actionlint..." && \
		bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash))
	@command -v markdownlint >/dev/null 2>&1 || npm install -g markdownlint-cli
	@command -v pre-commit >/dev/null 2>&1 || pip install pre-commit
	@cd ai-triage && npm install
	@echo "✅ All linting tools installed"

lint: lint-yaml lint-actions lint-markdown lint-ts ## Run all linters

lint-yaml: ## Lint YAML files
	@echo "Running yamllint..."
	@yamllint .

lint-actions: ## Lint GitHub Actions workflows
	@echo "Running actionlint..."
	@actionlint

lint-markdown: ## Lint Markdown files
	@echo "Running markdownlint..."
	@markdownlint '**/*.md' --config .markdownlint.json

lint-ts: ## Lint TypeScript code in ai-triage
	@echo "Running ESLint and Prettier for ai-triage..."
	@cd ai-triage && npm run lint
	@cd ai-triage && npx prettier --check '**/*.ts'

fix: ## Auto-fix linting issues where possible
	@echo "Auto-fixing linting issues..."
	@yamllint . --fix 2>/dev/null || true
	@markdownlint '**/*.md' --config .markdownlint.json --fix
	@cd ai-triage && npm run format
	@echo "✅ Auto-fix complete"

pre-commit-install: ## Install pre-commit hooks
	@echo "Installing pre-commit hooks..."
	@pre-commit install
	@echo "✅ Pre-commit hooks installed"

pre-commit-run: ## Run pre-commit on all files
	@echo "Running pre-commit on all files..."
	@pre-commit run --all-files

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf ai-triage/dist
	@rm -rf ai-triage/node_modules
	@echo "✅ Clean complete"

build-ai-triage: ## Build ai-triage action
	@echo "Building ai-triage action..."
	@cd ai-triage && npm run all
	@echo "✅ Build complete"
