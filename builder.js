const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(__dirname, 'build');
const templatesDir = path.join(__dirname, 'templates');

// Garante que a pasta build existe
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

// Array para guardar a informação de todos os convites para o Index
let listaInstancias = [];

// Percorre todas as pastas (instâncias) dentro da pasta build/
fs.readdirSync(buildDir).forEach(instance => {
    const instancePath = path.join(buildDir, instance);
    const dataPath = path.join(instancePath, 'data.json');
    const statePath = path.join(instancePath, '.build_state.json');
    const thumbFlagPath = path.join(instancePath, '.needs_thumbnail');

    // Se a pasta for válida e tiver um data.json
    if (fs.existsSync(dataPath) && fs.lstatSync(instancePath).isDirectory()) {
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const data = JSON.parse(rawData);

        // Extrai o domínio limpo para o preview do WhatsApp
        let cleanDomain = 'website.com';
        if (data.baseUrl) {
            cleanDomain = data.baseUrl.replace(/^https?:\/\//, '').split('/')[0];
        }

        // Guarda os dados cruciais para o Índice ANTES de verificar o cache
        listaInstancias.push({
            pasta: instance,
            titulo: data.title || instance,
            descricao: data.description || 'Sem descrição',
            dominio: cleanDomain,
            template: data.template || 'Desconhecido',
            tipo: data.tipoEvento || 'Evento'
        });

        // VERIFICAÇÃO DE CACHE: O data.json mudou desde o último build?
        if (fs.existsSync(statePath)) {
            const lastState = fs.readFileSync(statePath, 'utf-8');
            if (rawData === lastState) {
                console.log(`⏩ A ignorar '${instance}': sem alterações no data.json`);
                return; // Pula esta instância e vai para a próxima
            }
        }

        const templateName = data.template;

        if (!templateName) {
            console.error(`[!] Erro: 'template' não definido no data.json de '${instance}'`);
            return;
        }

        const templatePath = path.join(templatesDir, templateName);
        if (!fs.existsSync(templatePath)) {
            console.error(`[!] Erro: O template '${templateName}' pedido por '${instance}' não existe.`);
            return;
        }

        console.log(`\n⚙️ A processar instância: ${instance} (usa o template: ${templateName})`);

        // ==========================================
        // 1. Compilar HTML (EJS)
        // ==========================================
        const filesToCompile = ['index.ejs', 'thumbnail.ejs'];
        filesToCompile.forEach(file => {
            const ejsFilePath = path.join(templatePath, file);
            if (fs.existsSync(ejsFilePath)) {
                const outputFilePath = path.join(instancePath, file.replace('.ejs', '.html'));
                
                ejs.renderFile(ejsFilePath, { data: data }, (err, str) => {
                    if (err) console.error(`[!] Erro no EJS em ${file}:`, err);
                    else {
                        fs.writeFileSync(outputFilePath, str);
                        console.log(`  📄 HTML: gerado ${file.replace('.ejs', '.html')}`);
                    }
                });
            }
        });

        // ==========================================
        // 2. Compilar SCSS para CSS
        // ==========================================
        const templateSassDir = path.join(templatePath, 'sass');
        const cssOutDir = path.join(instancePath, 'css');
        let scssFilesToCompile = [];

        if (!fs.existsSync(cssOutDir)) fs.mkdirSync(cssOutDir, { recursive: true });

        if (fs.existsSync(templateSassDir)) {
            scssFilesToCompile = fs.readdirSync(templateSassDir)
                .filter(file => file.endsWith('.scss') && !file.startsWith('_'))
                .map(file => path.join(templateSassDir, file));
        } else {
            scssFilesToCompile = fs.readdirSync(templatePath)
                .filter(file => file.endsWith('.scss') && !file.startsWith('_'))
                .map(file => path.join(templatePath, file));
        }

        if (scssFilesToCompile.length > 0) {
            scssFilesToCompile.forEach(scssFilePath => {
                const fileName = path.basename(scssFilePath);
                const cssFileName = fileName.replace('.scss', '.css');
                const cssOutPath = path.join(cssOutDir, cssFileName);
                const tempScssPath = path.join(instancePath, `temp_${fileName}`);

                try {
                    let scssContent = fs.readFileSync(scssFilePath, 'utf8');
                    let injectedScss = `$themeColor: ${data.themeColor};\n\n` + scssContent;
                    
                    fs.writeFileSync(tempScssPath, injectedScss);

                    const coreSassPath = path.join(__dirname, 'core', 'sass');
                    const templateSassPath = fs.existsSync(templateSassDir) ? templateSassDir : templatePath;
                    
                    execSync(`npx sass "${tempScssPath}" "${cssOutPath}" --load-path="${coreSassPath}" --load-path="${templateSassPath}" --no-source-map --style=compressed`, { stdio: 'inherit' });
                    
                    fs.unlinkSync(tempScssPath);
                    console.log(`  🎨 CSS: compilado ${cssFileName}`);

                } catch (error) {
                    console.error(`[!] Erro ao compilar ${fileName} para ${instance}.`);
                    if (fs.existsSync(tempScssPath)) fs.unlinkSync(tempScssPath);
                }
            });
        } else {
            console.log(`  ⚠️  Aviso: Não foram encontrados ficheiros SCSS principais no template.`);
        }

        // ==========================================
        // 3. Copiar Imagens e Assets
        // ==========================================
        const pastasParaCopiar = ['images', 'assets', 'js'];
        pastasParaCopiar.forEach(nomePasta => {
            const origemPasta = path.join(templatePath, nomePasta);
            const destinoPasta = path.join(instancePath, nomePasta);
            
            if (fs.existsSync(origemPasta)) {
                fs.cpSync(origemPasta, destinoPasta, { recursive: true });
                console.log(`  🖼️ Copiada a pasta: ${nomePasta}/`);
            }
        });

        // ==========================================
        // 4. Salvar Estado e Criar Flag de Thumbnail
        // ==========================================
        fs.writeFileSync(statePath, rawData);
        fs.writeFileSync(thumbFlagPath, 'true');

        console.log(`✅ Instância '${instance}' preparada com sucesso!`);
    }
});

// ==========================================
// 5. Gerar Ficheiro de Índice (Simulação WhatsApp)
// ==========================================
console.log(`\n🗂️ A gerar o índice de convites (Modo WhatsApp Preview)...`);

// Fallback de imagem em base64 (um retângulo cinza escrito "Gerando miniatura...") para quando o Chrome ainda não rodou.
const imgFallback = "this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22630%22%20style%3D%22background%3A%23e5e7eb%22%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui,%20sans-serif%22%20font-size%3D%2240%22%20fill%3D%22%239ca3af%22%3EA%20gerar%20miniatura...%3C%2Ftext%3E%3C%2Fsvg%3E'";

const indexHtmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Índice de Convites</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #e5ddd5; color: #111b21; padding: 40px 20px; margin: 0; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #111b21; padding-bottom: 10px; margin-bottom: 30px; text-align: center;}
        
        .grid { display: grid; gap: 30px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        
        /* Simulação Cartão WhatsApp */
        .card-wrapper { text-decoration: none; display: flex; flex-direction: column; transition: transform 0.2s; background: transparent; }
        .card-wrapper:hover { transform: translateY(-3px); }
        
        .wa-preview {
            background: #f0f2f5;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #d1d5db;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
        }
        
        .wa-image { width: 100%; aspect-ratio: 1200 / 630; background: #e5e7eb; position: relative; border-bottom: 1px solid #e2e8f0; }
        .wa-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        
        .wa-text { padding: 12px 14px; background: #f0f2f5; }
        .wa-title { font-size: 15px; font-weight: 600; color: #111b21; margin: 0 0 3px 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .wa-desc { font-size: 14px; color: #667781; margin: 0 0 4px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        .wa-domain { font-size: 12px; color: #8696a0; margin: 0; text-transform: lowercase; }
        
        /* Informação Extra (Fora do Preview) */
        .meta-info { margin-top: 10px; display: flex; justify-content: space-between; font-size: 0.85rem; color: #555; padding: 0 5px; }
        .tag { background: #dcf8c6; color: #128C7E; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 0.75rem; }
        
        .empty { color: #667781; font-style: italic; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Convites Prontos</h1>
        ${listaInstancias.length > 0 ? `
        <div class="grid">
            ${listaInstancias.map(inst => `
            <a href="${inst.pasta}/" class="card-wrapper" target="_blank" title="Abrir convite: ${inst.titulo}">
                <div class="wa-preview">
                    <div class="wa-image">
                        <img src="${inst.pasta}/images/thumbnail.png" alt="Thumbnail" onerror="${imgFallback}">
                    </div>
                    <div class="wa-text">
                        <h2 class="wa-title">${inst.titulo}</h2>
                        <p class="wa-desc">${inst.descricao}</p>
                        <p class="wa-domain">${inst.dominio}</p>
                    </div>
                </div>
                <div class="meta-info">
                    <span>📁 /${inst.pasta}</span>
                    <span class="tag">${inst.template}</span>
                </div>
            </a>
            `).join('')}
        </div>
        ` : '<p class="empty">Nenhum convite encontrado na pasta build/.</p>'}
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtmlContent);
console.log(`✅ Índice gerado com sucesso em: build/index.html\n`);