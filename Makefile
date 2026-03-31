.PHONY: install build run-builder watch thumbnails all deploy

# Configurações macOS
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Encontra todas as pastas de instâncias dentro de build/
INSTANCES = $(wildcard build/*)

install:
	npm install
	npm install -D nodemon ejs sass

# O 'make build' agora corre o script js e a seguir gera os thumbnails
build: run-builder thumbnails
	@echo "\n✨ Build concluído! (Apenas instâncias alteradas foram processadas)"

run-builder:
	@echo "🚀 A processar instâncias (HTML, CSS e Imagens)..."
	@node builder.js

# O watch agora corre o 'make build' inteiro sempre que deteta alterações
watch:
	@echo "👀 A escutar alterações em core/, templates/ e build/..."
	@npx nodemon -e ejs,scss,json -w core -w templates -w build -x "make build"

thumbnails:
	@echo "\n🎨 A verificar e gerar thumbnails para instâncias atualizadas..."
	@for dir in $(INSTANCES); do \
		if [ -f "$$dir/.needs_thumbnail" ] && [ -f "$$dir/thumbnail.html" ]; then \
			mkdir -p "$$dir/images"; \
			$(CHROME_BIN) --headless \
				--disable-gpu \
				--screenshot="$$dir/images/thumbnail.png" \
				--window-size=1200,630 \
				--force-device-scale-factor=1 \
				--hide-scrollbars \
				--virtual-time-budget=5000 \
				"file://$(shell pwd)/$$dir/thumbnail.html"; \
			rm "$$dir/.needs_thumbnail"; \
			echo "✅ Sucesso: $$dir/images/thumbnail.png gerado."; \
		fi \
	done

# Publica a pasta build/ no Cloudflare Pages
deploy: build
	@echo "☁️ A publicar a pasta build no Cloudflare Pages..."
	npx wrangler pages deploy build

all: build deploy