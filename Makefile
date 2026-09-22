# ATS Resume Pro
#
# Recipes are tab-indented (Make requires it). `make` with no target prints help.

COMPOSE ?= docker compose
SERVICE ?= app

# Host port. Also consumed by docker-compose.yml, so both stay in step.
ATS_PORT ?= 8100
export ATS_PORT

URL := http://localhost:$(ATS_PORT)

.DEFAULT_GOAL := help
.PHONY: help up down restart start stop pull build rebuild logs ps status sh health open clean dev install

## help: list the available targets
help:
	@echo "ATS Resume Pro"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed -e 's/## //' -e 's/:/\t-/' | awk -F'\t' '{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  Host port: $(ATS_PORT)  (override: make up ATS_PORT=9000)"

## up: pull latest changes, then rebuild and start the container
up: pull
	@echo ">> $(COMPOSE) up -d --build"
	@$(COMPOSE) up -d --build
	@echo ""
	@echo ">> ATS Resume Pro is running at $(URL)"

## pull: fast-forward the checkout from origin (skipped if no upstream)
pull:
	@if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
		echo ">> not a git repository - skipping git pull"; \
	elif ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then \
		echo ">> no upstream branch configured - skipping git pull"; \
	else \
		echo ">> git pull --ff-only"; \
		git pull --ff-only; \
	fi

## down: stop and remove the container
down:
	@$(COMPOSE) down

## restart: recreate the container without rebuilding the image
restart:
	@$(COMPOSE) restart $(SERVICE)

## start: start an already-built container
start:
	@$(COMPOSE) start $(SERVICE)
	@echo ">> $(URL)"

## stop: stop the container but keep it
stop:
	@$(COMPOSE) stop $(SERVICE)

## build: build the image without starting anything
build:
	@$(COMPOSE) build

## rebuild: build from scratch, ignoring the layer cache
rebuild:
	@$(COMPOSE) build --no-cache
	@$(COMPOSE) up -d

## logs: follow the container logs
logs:
	@$(COMPOSE) logs -f $(SERVICE)

## ps: show container status and published ports
ps status:
	@$(COMPOSE) ps

## health: check the app actually answers over HTTP
health:
	@printf ">> GET $(URL)  -> "
	@curl -s -o /dev/null -w "%{http_code}\n" $(URL) || echo "unreachable"

## sh: open a shell inside the running container
sh:
	@$(COMPOSE) exec $(SERVICE) sh

## clean: remove the container, its volumes and the built image
clean:
	@$(COMPOSE) down -v --remove-orphans
	@docker image rm ats-resume-pro:latest 2>/dev/null || true

## install: install npm dependencies on the host
install:
	@npm install

## dev: run the Vite dev server on the host with hot reload
dev:
	@npm run dev
