.PHONY: install build watch

# Encontra todas as pastas dentro de templates/

# Makefile macOS atualizado
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML_FILE = thumbnail.html
OUTPUT_IMG = thumbnail.png

TEMPLATES = $(wildcard templates/*)

install:
	npm install

build:
	@echo "A compilar todo o Sass..."
	@for dir in $(TEMPLATES); do \
		if [ -d "$$dir/sass" ]; then \
			npx sass $$dir/sass:$$dir/css --load-path=core/sass --no-source-map --style=compressed; \
		fi \
	done
	@echo "Build concluído!"

watch:
	@echo "A escutar alterações no Sass em todos os templates..."
	@for dir in $(TEMPLATES); do \
		if [ -d "$$dir/sass" ]; then \
			npx sass --watch $$dir/sass:$$dir/css --load-path=core/sass --no-source-map & \
		fi \
	done; \
	wait


all:
	@echo "🎨 A gerar thumbnail 1200x630..."
	@$(CHROME_BIN) --headless \
		--disable-gpu \
		--screenshot=$(OUTPUT_IMG) \
		--window-size=1200,630 \
		--force-device-scale-factor=1 \
		--hide-scrollbars \
		--virtual-time-budget=5000 \
		"file://$(shell pwd)/$(HTML_FILE)"
	@echo "✅ Sucesso: $(OUTPUT_IMG)"