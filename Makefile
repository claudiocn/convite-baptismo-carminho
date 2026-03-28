# Makefile macOS atualizado
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML_FILE = thumbnail.html
OUTPUT_IMG = thumbnail.png

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