// deploy-setup.js - совместимый с Node.js v12
const fs = require('fs');
const path = require('path');

console.log('🚀 Начало сборки...');

// Читаем конфиг из environment variables или .env файла
function getConfig() {
    // Пробуем прочитать из .env файла
    try {
        if (fs.existsSync('.env')) {
            const envContent = fs.readFileSync('.env', 'utf8');
            const envVars = {};
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim();
                }
            });
            console.log('📁 Загружены переменные из .env файла');
            return envVars;
        }
    } catch (error) {
        console.log('⚠️ .env файл не найден, используем environment variables');
    }

    // Используем environment variables
    return {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
    };
}

function copyFolderRecursiveSync(source, target, exclude) {
    // Создаем целевую папку если её нет
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    // Читаем файлы в исходной папке
    const files = fs.readdirSync(source);

    files.forEach(file => {
        // Пропускаем исключенные файлы/папки
        if (exclude.includes(file)) {
            return;
        }

        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        if (fs.statSync(sourcePath).isDirectory()) {
            // Рекурсивно копируем папки
            copyFolderRecursiveSync(sourcePath, targetPath, exclude);
        } else {
            // Копируем файлы
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

function buildForProduction() {
    const config = getConfig();

    // Проверяем что все переменные есть
    const requiredVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_DATABASE_URL',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    const missingVars = requiredVars.filter(varName => !config[varName]);
    if (missingVars.length > 0) {
        console.error('❌ Отсутствуют необходимые переменные:', missingVars);
        console.log('💡 Создайте .env файл или установите environment variables');
        process.exit(1);
    }

    console.log('🔧 Проверка конфигов:');
    console.log('  API Key:', config.FIREBASE_API_KEY ? '***SET***' : '***MISSING***');
    console.log('  Database URL:', config.FIREBASE_DATABASE_URL);
    console.log('  Project ID:', config.FIREBASE_PROJECT_ID);

    // Читаем шаблон конфига
    console.log('📁 Чтение шаблона из:', path.join(__dirname, 'js', 'config.js'));
    const configTemplate = fs.readFileSync(path.join(__dirname, 'js', 'config.js'), 'utf8');
    console.log('✅ Шаблон прочитан успешно');

    // Заменяем плейсхолдеры на реальные значения
    let finalConfig = configTemplate;
    finalConfig = finalConfig.replace(/%%FIREBASE_API_KEY%%/g, config.FIREBASE_API_KEY);
    finalConfig = finalConfig.replace(/%%FIREBASE_AUTH_DOMAIN%%/g, config.FIREBASE_AUTH_DOMAIN);
    finalConfig = finalConfig.replace(/%%FIREBASE_DATABASE_URL%%/g, config.FIREBASE_DATABASE_URL);
    finalConfig = finalConfig.replace(/%%FIREBASE_PROJECT_ID%%/g, config.FIREBASE_PROJECT_ID);
    finalConfig = finalConfig.replace(/%%FIREBASE_STORAGE_BUCKET%%/g, config.FIREBASE_STORAGE_BUCKET);
    finalConfig = finalConfig.replace(/%%FIREBASE_MESSAGING_SENDER_ID%%/g, config.FIREBASE_MESSAGING_SENDER_ID);
    finalConfig = finalConfig.replace(/%%FIREBASE_APP_ID%%/g, config.FIREBASE_APP_ID);

    // Создаем папку dist если её нет
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }

    // Копируем все файлы в dist
    console.log('📁 Копирование файлов...');
    copyFolderRecursiveSync('.', 'dist', ['.git', 'node_modules', 'dist', '.env']);

    // Записываем финальный config.js в dist
    const configOutputPath = path.join('dist', 'js', 'config.js');
    fs.writeFileSync(configOutputPath, finalConfig);

    console.log('✅ Production build создан в папке dist/');
    console.log('🔐 Firebase конфиг защищен');
    console.log('📊 Database URL:', config.FIREBASE_DATABASE_URL);
    console.log('📄 Config записан в:', configOutputPath);

    console.log('\n🔍 Содержимое config.js:');
    console.log('----------------------');
    console.log(finalConfig.substring(0, 300) + '...');
    console.log('----------------------');
}

// Запускаем сборку
buildForProduction();