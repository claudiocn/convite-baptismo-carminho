.PHONY: install build run-builder watch thumbnails all

# Configurações macOS
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Encontra todas as pastas de instâncias dentro de build/
INSTANCES = $(wildcard build/*)

install:
	npm install
	npm install -D nodemon ejs sass

# O 'make build' agora corre o script js e a seguir gera os thumbnails
build: run-builder thumbnails
	@echo "\n✨ Build totalmente concluído (Ficheiros + Thumbnails gerados)!"

run-builder:
	@echo "🚀 A processar instâncias (HTML, CSS e Imagens)..."
	@node builder.js

# O watch agora corre o 'make build' inteiro sempre que deteta alterações
watch:
	@echo "👀 A escutar alterações em core/, templates/ e build/..."
	@npx nodemon -e ejs,scss,json -w core -w templates -w build -x "make build"

thumbnails:
	@echo "\n🎨 A gerar thumbnails 1200x630 para todas as instâncias..."
	@for dir in $(INSTANCES); do \
		if [ -f "$$dir/thumbnail.html" ]; then \
			mkdir -p "$$dir/images"; \
			$(CHROME_BIN) --headless \
				--disable-gpu \
				--screenshot="$$dir/images/thumbnail.png" \
				--window-size=1200,630 \
				--force-device-scale-factor=1 \
				--hide-scrollbars \
				--virtual-time-budget=5000 \
				"file://$(shell pwd)/$$dir/thumbnail.html"; \
			echo "✅ Sucesso: $$dir/images/thumbnail.png"; \
		fi \
	done

all: build