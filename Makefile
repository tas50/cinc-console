# cinc-console developer tasks.
# Run `make help` for a list.

IMAGE ?= ghcr.io/tas50/cinc-console
TAG ?= dev
CHART := deploy/helm/cinc-console

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Install dependencies
	pnpm install

.PHONY: dev
dev: ## Run the dev server (http://localhost:3000)
	pnpm dev

.PHONY: test
test: ## Run unit tests
	pnpm test

.PHONY: lint
lint: ## Run eslint
	pnpm lint

.PHONY: build
build: ## Production build
	pnpm build

.PHONY: check
check: test lint build ## Run tests, lint, and build (CI parity)

.PHONY: docker-build
docker-build: ## Build the container image ($(IMAGE):$(TAG))
	docker build -t $(IMAGE):$(TAG) .

.PHONY: smoke
smoke: ## Build the image and verify /api/healthz
	bash scripts/smoke.sh

.PHONY: helm-lint
helm-lint: ## Lint the Helm chart
	helm lint $(CHART) --set cincServerUrl=https://chef.example.com --set webuiKey=DUMMY

.PHONY: helm-template
helm-template: ## Render the Helm chart
	helm template c $(CHART) --set cincServerUrl=https://chef.example.com --set webuiKey=DUMMY

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf .next node_modules/.cache
