const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(__dirname, 'build');
const templatesDir = path.join(__dirname, 'templates');

// Garante que a pasta build existe
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

// Percorre todas as pastas (instâncias) dentro da pasta build/
fs.readdirSync(buildDir).forEach(instance => {
    const instancePath = path.join(buildDir, instance);
    const dataPath = path.join(instancePath, 'data.json');

    // Se a pasta for válida e tiver um data.json
    if (fs.existsSync(dataPath) && fs.lstatSync(instancePath).isDirectory()) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
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
                const fileName = path.basename(scssFilePath); // ex: 'style.scss'
                const cssFileName = fileName.replace('.scss', '.css'); // ex: 'style.css'
                const cssOutPath = path.join(cssOutDir, cssFileName);
                const tempScssPath = path.join(instancePath, `temp_${fileName}`);

                try {
                    // Injeta a cor do data.json no topo do SCSS
                    let scssContent = fs.readFileSync(scssFilePath, 'utf8');
                    let injectedScss = `$themeColor: ${data.themeColor};\n\n` + scssContent;
                    
                    // Cria ficheiro temporário
                    fs.writeFileSync(tempScssPath, injectedScss);

                    // Paths para os imports (@use / @import)
                    const coreSassPath = path.join(__dirname, 'core', 'sass');
                    const templateSassPath = fs.existsSync(templateSassDir) ? templateSassDir : templatePath;
                    
                    // Compila usando o Sass
                    execSync(`npx sass "${tempScssPath}" "${cssOutPath}" --load-path="${coreSassPath}" --load-path="${templateSassPath}" --no-source-map --style=compressed`, { stdio: 'inherit' });
                    
                    // Limpa o ficheiro temporário
                    fs.unlinkSync(tempScssPath);
                    console.log(`  🎨 CSS: compilado ${cssFileName}`);

                } catch (error) {
                    console.error(`[!] Erro ao compilar ${fileName} para ${instance}.`);
                    // Garante que o ficheiro temporário é apagado mesmo que falhe
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

        console.log(`✅ Instância '${instance}' preparada com sucesso!`);
    }
});