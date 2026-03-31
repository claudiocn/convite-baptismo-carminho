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

        // Guarda os dados para o Índice ANTES de verificar o cache
        // Assim o Índice tem sempre a lista completa
        listaInstancias.push({
            pasta: instance,
            titulo: data.title || instance,
            template: data.template || 'Desconhecido',
            tipo: data.tipoEvento || 'Evento'
        });

        // VERIFICAÇÃO DE CACHE: O data.json mudou desde o último build?
        if (fs.existsSync(statePath)) {
            const lastState = fs.readFileSync(statePath, 'utf-8');
            if (rawData === lastState) {
                console.log(`⏩ A ignorar '${instance}': sem alterações no data.json`);
                return; // Pula a compilação desta instância e vai para a próxima
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

        // Garante que a pasta css/ existe na instância
        if (!fs.existsSync(cssOutDir)) fs.mkdirSync(cssOutDir, { recursive: true });

        // Procura os ficheiros SCSS (ignora os que começam por '_' pois são parciais)
        if (fs.existsSync(templateSassDir)) {
            scssFilesToCompile = fs.readdirSync(templateSassDir)
                .filter(file => file.endsWith('.scss') && !file.startsWith('_'))
                .map(file => path.join(templateSassDir, file));
        } else {
            // Fallback: procura na raiz do template se a pasta sass/ não existir
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
                    // Injeta a cor do data.json no topo do SCSS
                    let scssContent = fs.readFileSync(scssFilePath, 'utf8');
                    let injectedScss = `$themeColor: ${data.themeColor};\n\n` + scssContent;
                    
                    // Cria ficheiro temporário
                    fs.writeFileSync(tempScssPath, injectedScss);

                    // Paths para os imports
                    const coreSassPath = path.join(__dirname, 'core', 'sass');
                    const templateSassPath = fs.existsSync(templateSassDir) ? templateSassDir : templatePath;
                    
                    // Compila usando o Sass
                    execSync(`npx sass "${tempScssPath}" "${cssOutPath}" --load-path="${coreSassPath}" --load-path="${templateSassPath}" --no-source-map --style=compressed`, { stdio: 'inherit' });
                    
                    // Limpa o ficheiro temporário
                    fs.unlinkSync(tempScssPath);
                    console.log(`  🎨 CSS: compilado ${cssFileName}`);

                } catch (error) {
                    console.error(`[!] Erro ao compilar ${fileName} para ${instance}.`);
                    if (fs.existsSync(tempScssPath)) fs.unlinkSync(tempScssPath);
                }
            });
        } else {
            console.log(`  ⚠️  Aviso: Não foram encontrados ficheiros SCSS principais no template. O CSS não foi gerado.`);
        }

        // ==========================================
        // 3. Copiar Imagens e outros Assets
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
        fs.writeFileSync(statePath, rawData); // Guarda a versão atual do data.json
        fs.writeFileSync(thumbFlagPath, 'true'); // Avisa o Makefile para gerar a thumbnail

        console.log(`✅ Instância '${instance}' preparada com sucesso!`);
    }
});

// ==========================================
// 5. Gerar Ficheiro de Índice (index.html na raiz do build/)
// ==========================================
console.log(`\n🗂️ A gerar o índice de convites...`);
const indexHtmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Índice de Convites - Builder</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #f4f4f5; color: #333; padding: 40px 20px; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 30px; }
        .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #e4e4e7; }
        .card h2 { margin: 0 0 10px 0; font-size: 1.2rem; color: #111827; }
        .card p { margin: 5px 0; font-size: 0.9rem; color: #6b7280; }
        .tag { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; margin-bottom: 10px;}
        .links { margin-top: 15px; display: flex; gap: 10px; }
        .links a { text-decoration: none; color: white; background: #10b981; padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; text-align: center; flex: 1; transition: background 0.2s; }
        .links a.thumb-link { background: #6366f1; }
        .links a:hover { opacity: 0.9; }
        .empty { color: #6b7280; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Convites Gerados</h1>
        ${listaInstancias.length > 0 ? `
        <div class="grid">
            ${listaInstancias.map(inst => `
            <div class="card">
                <span class="tag">${inst.tipo}</span>
                <h2>${inst.titulo}</h2>
                <p><strong>Pasta:</strong> /${inst.pasta}</p>
                <p><strong>Template:</strong> ${inst.template}</p>
                <div class="links">
                    <a href="${inst.pasta}/" target="_blank">Abrir Convite</a>
                    <a href="${inst.pasta}/thumbnail.html" class="thumb-link" target="_blank">Ver Thumbnail</a>
                </div>
            </div>
            `).join('')}
        </div>
        ` : '<p class="empty">Nenhum convite encontrado na pasta build/.</p>'}
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtmlContent);
console.log(`✅ Índice gerado com sucesso em: build/index.html\n`);