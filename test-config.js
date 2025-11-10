// test-config.js
const fs = require('fs');

function testConfig() {
    try {
        const configContent = fs.readFileSync('dist/js/config.js', 'utf8');
        console.log('📄 Содержимое config.js:');
        console.log(configContent);

        // Проверяем что плейсхолдеры заменены
        if (configContent.includes('%%')) {
            console.error('❌ В config.js остались плейсхолдеры!');
            return false;
        }

        // Проверяем database URL
        const dbUrlMatch = configContent.match(/databaseURL:\s*"([^"]+)"/);
        if (dbUrlMatch && dbUrlMatch[1]) {
            console.log('✅ Database URL:', dbUrlMatch[1]);
            if (!dbUrlMatch[1].startsWith('https://')) {
                console.error('❌ Database URL должен начинаться с https://');
                return false;
            }
        }

        console.log('✅ Конфиг прошел проверку');
        return true;
    } catch (error) {
        console.error('❌ Ошибка проверки конфига:', error);
        return false;
    }
}

testConfig();